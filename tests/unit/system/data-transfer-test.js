import DataTransfer from 'ember-file-upload/system/data-transfer';
import {
  module,
  test
} from 'qunit';

module('data-transfer', {
  beforeEach() {
    this.subject = DataTransfer.create();
  },
  afterEach() {
    this.subject = null;
  }
});

test('with no native dataTransfer', function (assert) {
  assert.ok(this.subject.get('valid'));
  return this.subject.get('files').then((files) => {
    assert.equal(files, null);
  });
});

test('multiple=false; a single item being dragged', function (assert) {
  this.subject.set('dataTransfer', {
    items: [{
      type: 'image/jpeg'
    }]
  });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 1);
  });

  return this.subject.get('valid').then((valid) => {
    assert.ok(valid);
  });
});

test('multiple=false; a single file being dropped', function (assert) {
  this.subject.set('dataTransfer', {
    files: [{
      name: 'tomster.jpg',
      type: 'image/jpeg'
    }]
  });

  this.subject.get('valid').then((valid) => {
    assert.ok(valid);
  });

  return this.subject.get('files').then((files) => {
    assert.equal(files.length, 1);
  });
});

test('multiple=false; multiple items being dragged', function (assert) {
  this.subject.set('dataTransfer', {
    items: [{
      type: 'image/jpeg'
    }, {
      type: 'image/png'
    }]
  });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 1);
  });

  return this.subject.get('valid').then((valid) => {
    assert.notOk(valid);
  });
});

test('multiple=false; multiple files being dropped', function (assert) {
  this.subject.set('dataTransfer', {
    files: [{
      name: 'tomster.jpg',
      type: 'image/jpeg'
    }, {
      name: 'zoey.png',
      type: 'image/png'
    }]
  });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 1);
  });

  return this.subject.get('valid').then((valid) => {
    assert.notOk(valid);
  });
});

test('multiple=true; a single item being dragged', function (assert) {
  this.subject.set('dataTransfer', {
    items: [{
      type: 'image/jpeg'
    }]
  });
  this.subject.set('queue', { multiple: true });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 1);
  });

  return this.subject.get('valid').then((valid) => {
    assert.ok(valid);
  });
});

test('multiple=true; a single file being dropped', function (assert) {
  this.subject.set('dataTransfer', {
    files: [{
      name: 'tomster.jpg',
      type: 'image/jpeg'
    }]
  });
  this.subject.set('queue', { multiple: true });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 1);
  });

  return this.subject.get('valid').then((valid) => {
    assert.ok(valid);
  });
});

test('multiple=true; multiple items being dragged', function (assert) {
  this.subject.set('dataTransfer', {
    items: [{
      type: 'image/jpeg'
    }, {
      type: 'image/png'
    }]
  });
  this.subject.set('queue', { multiple: true });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 2);
  });

  return this.subject.get('valid').then((valid) => {
    assert.ok(valid);
  });
});

test('multiple=true; multiple files being dropped', function (assert) {
  this.subject.set('dataTransfer', {
    files: [{
      name: 'tomster.jpg',
      type: 'image/jpeg'
    }, {
      name: 'zoey.png',
      type: 'image/png'
    }]
  });
  this.subject.set('queue', { multiple: true });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 2);
  });

  return this.subject.get('valid').then((valid) => {
    assert.ok(valid);
  });
});

test('mime types validation with items being dragged', function (assert) {
  this.subject.set('dataTransfer', {
    items: [{
      type: 'image/jpeg'
    }, {
      type: 'image/png'
    }, {
      type: 'image/gif'
    }, {
      type: 'video/mp4'
    }, {
      type: 'video/avi'
    }]
  });
  this.subject.set('queue', {
    multiple: true,
    accept: 'image/gif, video/*'
  });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 3);
    assert.deepEqual(files, [{
      type: 'image/gif'
    }, {
      type: 'video/mp4'
    }, {
      type: 'video/avi'
    }]);
  });

  return this.subject.get('valid').then((valid) => {
    assert.notOk(valid);
  });
});

test('extension validation with files being dropped', function (assert) {
  this.subject.set('dataTransfer', {
    files: [{
      name: 'tomster.jpg',
      type: 'image/jpeg'
    }, {
      name: 'zoey.png',
      type: 'image/png'
    }, {
      name: 'pug-life.GIF',
      type: 'image/gif'
    }, {
      name: 'pug-snoring.mp4',
      type: 'video/mpeg4'
    }]
  });
  this.subject.set('queue', {
    multiple: true,
    accept: '.gif, .mp4'
  });

  this.subject.get('files').then((files) => {
    assert.equal(files.length, 2);
    assert.deepEqual(files, [{
      name: 'pug-life.GIF',
      type: 'image/gif'
    }, {
      name: 'pug-snoring.mp4',
      type: 'video/mpeg4'
    }]);
  });

  return this.subject.get('valid').then((valid) => {
    assert.notOk(valid);
  });
});
