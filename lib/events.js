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

const {Kafka, logLevel} = require('kafkajs');
const config = require('./config.js');

const userEventTypes = {
  created: 'users:create',
  updated: 'users:update',
  deleted: 'users:delete',
};

async function createEventConsumer(config, userEventsHandler, log) {
  assertConfigValid(config);

  const kafka = new Kafka({
    clientId: config.cloudEventsSource,
    brokers: config.brokers,
    logLevel: logLevel.ERROR,
  });
  const deadLetterProducer = kafka.producer();
  const consumer = kafka.consumer({
    groupId: config.consumerGroup,
  });

  await deadLetterProducer.connect();
  await consumer.connect();

  await consumer.subscribe({
    fromBeginning: true,
    topic: config.topic,
  });

  const processMessage = async (message) => {
    try {
      await handleUserEvent(message, userEventsHandler);
    } catch (err) {
      const eventId = getCloudEventId(message);
      log.error({eventId, err}, `Error occurred while processing event. Sending to deal-letter topic.`);
      return deadLetterProducer.send({
        topic: config.deadLettersTopic,
        messages: [message],
      });
    }
  };

  return {
    start: () => {
      log.info('starting kafka events consumer');
      consumer.run({
        eachMessage: async ({message}) => {
          try {
            await processMessage(message);
          } catch (err) {
            log.error({message, err}, `Error occurred while processing message`);
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

async function handleUserEvent(message, userEventHandler) {
  const handle = getHandlerForMessage(message, userEventHandler);
  if (handle != null) {
    const eventId = getCloudEventId(message);
    const payload = JSON.parse(message.value.toString());
    return await handle(payload, eventId);
  }
}

function getCloudEventId(message) {
  if (message.headers == null || message.headers.ce_id == null) {
    return null;
  }
  return message.headers.ce_id.toString();
}

function getHandlerForMessage(message, userEventHandler) {
  let handler = null;
  if (message.headers == null || message.headers.ce_type == null) {
    return handler;
  }
  const eventType = message.headers.ce_type.toString();
  switch (eventType) {
    case userEventTypes.created:
      if (typeof userEventHandler.onUserCreated == 'function') {
        handler = userEventHandler.onUserCreated;
      }
      break;
    case userEventTypes.updated:
      if (typeof userEventHandler.onUserUpdated == 'function') {
        handler = userEventHandler.onUserCreated;
      }
      break;
    case userEventTypes.deleted:
      if (typeof userEventHandler.onUserDeleted == 'function') {
        handler = userEventHandler.onUserDeleted;
      }
      break;
  }
  return handler;
}

function loadConfigFromEnv() {
  const topicPrefix = config.fromEnvironment('KAFKA_TOPIC_PREFIX');
  const topic = config.fromEnvironment('KAFKA_TOPIC');
  const deadLettersTopic = config.fromEnvironment('KAFKA_DEAD_LETTERS_TOPIC');
  const brokers = config.fromEnvironment('KAFKA_BROKERS');
  const cloudEventsSource = config.fromEnvironment('CLOUD_EVENTS_SOURCE');
  const consumerGroup = config.fromEnvironment('KAFKA_CONSUMER_GROUP');
  const requireSSL = config.fromEnvironment('KAFKA_REQUIRE_SSL') === 'true';

  if (topicPrefix == null) {
    throw new Error('Kafka topic prefix is empty');
  }
  if (topic == null) {
    throw new Error('Kafka topic is empty');
  }
  if (deadLettersTopic == null) {
    throw new Error('Kafka dead letters topic is empty');
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
    deadLettersTopic: topicPrefix + deadLettersTopic,
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

module.exports = {
  createEventConsumer,
  loadConfigFromEnv,
};
