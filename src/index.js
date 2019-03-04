'use strict';

const { pipeline } = require('stream');

module.exports = function pipefy(streams, { propagateError }, callback) {
  if (!propagateError) {
    return pipeline(...streams, callback);
  }

  streams[0].on('error', error => {
    callback(error);
  });

  return streams
    .reduce((s1, s2) => {
      s1.pipe(s2);

      s2.on('error', error => {
        callback(error);
        s1.pipe(s2);
      });

      return s2;
    })
    .on('finish', () => {
      callback();
    });
};
