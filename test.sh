#!/bin/bash -eu

./node_modules/.bin/jshint *.js lib/*.js test/*.js 
npm test
