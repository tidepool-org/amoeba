/*
 == BSD2 LICENSE ==
 Copyright (c) 2014, Tidepool Project

 This program is free software; you can redistribute it and/or modify it under
 the terms of the associated License, which is identical to the BSD 2-Clause
 License as published by the Open Source Initiative at opensource.org.

 This program is distributed in the hope that it will be useful, but WITHOUT
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 FOR A PARTICULAR PURPOSE. See the License for more details.

 You should have received a copy of the License along with this program; if
 not, you can obtain one from Tidepool Project at tidepool.org.
 == BSD2 LICENSE ==
 */
'use strict';

const { Kafka, logLevel } = require('kafkajs');
const config = require('./config.js');
const { v4: uuidv4 } = require('uuid');

const userEventTypes = {
  created: 'users:create',
  updated: 'users:update',
  deleted: 'users:delete',
};

const metricEventTypes = {
  created: 'metrics:create'
}

function createKafka(config) {
  const opts = {
    clientId: config.cloudEventsSource,
    brokers: config.brokers,
    logLevel: getLogLevel(config),
    ssl: config.requireSSL,
  };
  if (config.username != null && config.password != null) {
    opts.sasl = {
      mechanism: 'scram-sha-512',
      username: config.username,
      password: config.password,
    };
  }
  return new Kafka(opts);
}

async function createEventProducer(config, log, topic) {
  assertConfigValid(config);
  topic = topic || config.topic;
  const kafka = createKafka(config);
  const producer = kafka.producer();
  await producer.connect();
  return {
    start: () => {
      log.info("creating event producer for: " + topic)
    },
    sendEvent: (eventType, payload, headers) => {
      headers = headers || {}
      if (typeof payload != 'string') {
        payload = JSON.stringify(payload)
      }
      const message = {
        value: payload,
        headers: {
          ce_id: uuidv4(),
          ce_type: eventType,
          ...headers,
        }
      }
      return producer.send({
        topic: topic,
        messages: [message],
      });
    },
    stop: async () => {
      try {
        await producer.disconnect();
      } catch (e) {
        log.error(e, 'error occurred while disconnecting producer');
      }
    },
  }
}

async function createEventConsumer(config, eventHandlers, log) {
  assertConfigValid(config);

  const kafka = createKafka(config)
  let deadLetterProducer = null 
  if (config.deadLetterTopic != null) {
    deadLetterProducer = await createEventProducer(config, log, config.deadLetterTopic);
  }
  const consumer = kafka.consumer({
    groupId: config.consumerGroup,
  });

  await consumer.connect();
  await consumer.subscribe({
    fromBeginning: true,
    topic: config.topic,
  });

  const processMessage = async (message) => {
    try {
      await handleEvent(message, eventHandlers);
    } catch (err) {
      const eventId = getCloudEventId(message);
      log.error({ eventId, err }, `Error occurred while processing event. Sending to dead-letter topic.`);
      if (deadLetterProducer != null) {
        return deadLetterProducer.sendEvent(
         getCloudEventType(message), message.value, message.headers
        );
      }
    }
  };

  return {
    start: () => {
      log.info('starting kafka events consumer');
      consumer.run({
        eachMessage: async ({ message }) => {
          try {
            await processMessage(message);
          } catch (err) {
            log.error({ message, err }, `Error occurred while processing message`);
          }
        },
      });
    },
    stop: async () => {
      try {
        await consumer.disconnect();
      } catch (e) {
        log.error(e, 'error occurred while disconnecting consumer');
      }
      try {
        await deadLetterProducer.disconnect();
      } catch (e) {
        log.error(e, 'error occurred while disconnecting producer');
      }
    },
  };
}

async function handleEvent(message, eventHandlers) {
  const handle = getHandlerForMessage(message, eventHandlers);
  if (handle != null) {
    const eventId = getCloudEventId(message);
    const payload = JSON.parse(message.value.toString());
    return await handle(payload, eventId);
  }
}

function getCloudEventType(message) {
  if (message.headers == null || message.headers.ce_type == null) {
    return null;
  }
  return message.headers.ce_type.toString();
}

function getCloudEventId(message) {
  if (message.headers == null || message.headers.ce_id == null) {
    return null;
  }
  return message.headers.ce_id.toString();
}

function getHandlerForMessage(message, eventHandlers) {
  let handler = null;
  if (message.headers == null || message.headers.ce_type == null) {
    return handler;
  }
  const eventType = message.headers.ce_type.toString();
  handler = eventHandlers[eventType];
  if (typeof handler != "function") {
    return null;
  }

  return handler;
}

function loadConfigFromEnv() {
  const topicPrefix = config.fromEnvironment('KAFKA_TOPIC_PREFIX');
  const topic = config.fromEnvironment('KAFKA_TOPIC');
  const deadLettersTopic = config.fromEnvironment('KAFKA_DEAD_LETTERS_TOPIC', null);
  const brokers = config.fromEnvironment('KAFKA_BROKERS');
  const cloudEventsSource = config.fromEnvironment('CLOUD_EVENTS_SOURCE');
  const consumerGroup = config.fromEnvironment('KAFKA_CONSUMER_GROUP');
  const requireSSL = config.fromEnvironment('KAFKA_REQUIRE_SSL') === 'true';
  const username = config.fromEnvironment('KAFKA_USERNAME', null);
  const password = config.fromEnvironment('KAFKA_PASSWORD', null);
  const clientLogLevel = config.fromEnvironment('KAFKA_CLIENT_LOG_LEVEL', 'ERROR');

  if (topicPrefix == null) {
    throw new Error('Kafka topic prefix is empty');
  }
  if (topic == null) {
    throw new Error('Kafka topic is empty');
  }

  if (brokers == null) {
    throw new Error('Kafka brokers is empty');
  }
  if (consumerGroup == null) {
    throw new Error('Kafka consumer group is empty');
  }
  if (cloudEventsSource == null) {
    throw new Error('Cloud events source is empty');
  }

  return {
    brokers: brokers.split(','),
    consumerGroup: consumerGroup,
    cloudEventsSource: cloudEventsSource,
    requireSSL: requireSSL,
    topic: topicPrefix + topic,
    username: username,
    password: password,
    deadLettersTopic: topicPrefix + deadLettersTopic,
    clientLogLevel: clientLogLevel,
  };
}

function assertConfigValid(config) {
  if (config == null) {
    throw new Error('Config is not set');
  }
  if (!config.brokers || !config.brokers.length) {
    throw new Error('Brokers is not set');
  }
  if (!config.cloudEventsSource) {
    throw new Error('Cloud events source is not set');
  }
  if (!config.consumerGroup) {
    throw new Error('Consumer group is not set');
  }
  if (!config.topic) {
    throw new Error('Topic is not set');
  }
  if (!config.deadLettersTopic) {
    throw new Error('Dead letter topic is not set');
  }
}

function getLogLevel(config) {
  const level = logLevel[config.clientLogLevel];
  return level || logLevel.ERROR;
}

module.exports = {
  createEventConsumer,
  createEventProducer,
  loadConfigFromEnv,
  metricEventTypes,
  userEventTypes,
};
