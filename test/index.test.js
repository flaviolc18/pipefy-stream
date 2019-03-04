'use strict';

const { test } = require('tap');
const { Readable, Transform } = require('stream');

const pipefy = require('../src');

test('a few streams with no error', t => {
  const s1 = getReadable('TEST');
  const s2 = getTransform();
  const s3 = getTransform();
  const s4 = getTransform({ callback: chunk => t.same(chunk.toString(), 'TEST') });

  pipefy([s1, s2, s3, s4], { propagateError: false }, err => {
    t.notOk(err);
    t.end();
  });
});

test('a few streams with no error propagation', t => {
  const s1 = getReadable('TEST');
  const s2 = getTransform({ errorMsg: 'Error transform1' });
  const s3 = getTransform({ errorMsg: 'Error transform2' });
  const s4 = getTransform({ callback: chunk => t.same(chunk.toString(), 'TEST') });

  pipefy([s1, s2, s3, s4], { propagateError: false }, ({ message } = {}) => {
    t.same(message, 'Error transform1');
    t.end();
  });
});

test('a few streams with error propagation', t => {
  const s1 = getReadable('TEST');
  const s2 = getTransform({ errorMsg: 'Error transform1' });
  const s3 = getTransform({ errorMsg: 'Error transform2' });
  const s4 = getTransform({ callback: chunk => t.same(chunk.toString(), 'TEST') });

  const erros = [];

  pipefy([s1, s2, s3, s4], { propagateError: true }, ({ message } = {}) => {
    if (message) {
      erros.push(message);
    } else {
      t.same(erros[0], 'Error transform1');
      t.same(erros[1], 'Error transform2');
      t.end();
    }
  });
});

test('error propagation on the first stream', t => {
  const s1 = getReadable('TEST');
  const s2 = getTransform({ errorMsg: 'Error transform1' });
  const s3 = getTransform({ errorMsg: 'Error transform2' });
  const s4 = getTransform({ callback: chunk => t.same(chunk.toString(), 'TEST') });

  const erros = [];

  s2.on('error', () => {
    s1.pipe(s2);
  });

  pipefy([s1.pipe(s2), s3, s4], { propagateError: true }, ({ message } = {}) => {
    if (message) {
      erros.push(message);
    } else {
      t.same(erros[0], 'Error transform1');
      t.same(erros[1], 'Error transform2');
      t.end();
    }
  });
});

test('error propagation and chunk push on the first stream', t => {
  let i = 1;
  const s1 = getReadable('TEST1', 'TEST2', 'TEST3');
  const s2 = getTransform({ errorMsg: 'Error transform1' });
  const s3 = getTransform({ errorMsg: 'Error transform2' });
  const s4 = getTransform({ callback: chunk => t.same(chunk.toString(), 'TEST' + i++) });

  const erros = [];

  s2.on('error', () => {
    s1.pipe(s2);
  });

  pipefy([s1.pipe(s2), s3, s4], { propagateError: true }, ({ message } = {}) => {
    if (message) {
      erros.push(message);
    } else {
      t.same(erros[0], 'Error transform1');
      t.same(erros[1], 'Error transform2');
      t.same(i, 4);
      t.end();
    }
  });
});

function getReadable(...strings) {
  return new Readable({
    read() {
      strings.forEach(string => this.push(string));
      this.push(null);
    },
  });
}

function getTransform({ callback, errorMsg } = {}) {
  return new Transform({
    transform(chunk, encoding, done) {
      callback && callback(chunk);
      errorMsg && this.emit('error', new Error(errorMsg));
      this.push(chunk);
      done();
    },
  });
}
