/* global Blob, Uint8Array */
import Ember from 'ember';
import layout from './template';
import DataTransfer from '../../system/data-transfer';
import uuid from '../../system/uuid';
import DragListener from '../../system/drag-listener';

const { $, get, set, computed } = Ember;
const { bind } = Ember.run;
const { service } = Ember.inject;

const DATA_TRANSFER = 'DATA_TRANSFER' + uuid.short();

let supported = (function () {
  return typeof window !== 'undefined' && window.document &&
         'draggable' in document.createElement('span');
}());

const dragListener = new DragListener();

export default Ember.Component.extend({

  layout,

  name: null,

  supported,

  ondragenter: null,

  ondragleave: null,

  fileQueue: service(),

  /**
    Whether users can upload content
    from websites by dragging images from
    another webpage and dropping it into
    your app. The default is `false` to
    prevent cross-site scripting issues.

    @property allowUploadsFromWebsites
    @type Boolean
    @default false
   */
  allowUploadsFromWebsites: false,

  /**
    This is the type of cursor that should
    be shown when a drag event happens.

    Corresponds to `dropEffect`.

    This is one of the following:

    - `copy`
    - `move`
    - `link`

    @property cursor
    @type String
    @default null
   */
  cursor: null,

  queue: computed('name', {
    get() {
      let queueName = get(this, 'name');
      let queues = get(this, 'fileQueue');
      return queues.find(queueName) ||
             queues.create(queueName);
    }
  }),

  didInsertElement() {
    this._super();

    dragListener.addEventListeners(`#${get(this, 'elementId')}`, {
      dragenter: bind(this, 'didEnterDropzone'),
      dragleave: bind(this, 'didLeaveDropzone'),
      dragover:  bind(this, 'didDragOver'),
      drop:      bind(this, 'didDrop')
    });
  },

  willDestroyElement() {
    dragListener.removeEventListeners(`#${get(this, 'elementId')}`);
  },

  isAllowed() {
    return get(this[DATA_TRANSFER], 'source') === 'os' ||
           get(this, 'allowUploadsFromWebsites');
  },

  didEnterDropzone(evt) {
    let dataTransfer = DataTransfer.create({
      queue: get(this, 'queue'),
      source: evt.source,
      dataTransfer: evt.dataTransfer
    });
    this[DATA_TRANSFER] = dataTransfer;

    if (this.isAllowed()) {
      evt.dataTransfer.dropEffect = get(this, 'cursor');
      set(this, 'active', true);

      get(dataTransfer, 'valid').then((valid) => {
        set(this, 'valid', valid);
      });

      if (this.ondragenter) {
        this.ondragenter(dataTransfer);
      }
    }
  },

  didLeaveDropzone(evt) {
    set(this[DATA_TRANSFER], 'dataTransfer', evt.dataTransfer);
    if (this.isAllowed()) {
      evt.dataTransfer.dropEffect = get(this, 'cursor');
      if (this.ondragleave) {
        this.ondragleave(this[DATA_TRANSFER]);
        this[DATA_TRANSFER] = null;
      }

      set(this, 'active', false);
    }
  },

  didDragOver(evt) {
    set(this[DATA_TRANSFER], 'dataTransfer', evt.dataTransfer);
    if (this.isAllowed()) {
      evt.dataTransfer.dropEffect = get(this, 'cursor');
    }
  },

  didDrop(evt) {
    set(this[DATA_TRANSFER], 'dataTransfer', evt.dataTransfer);

    if (!this.isAllowed()) {
      evt.dataTransfer.dropEffect = get(this, 'cursor');
      this[DATA_TRANSFER] = null;
      return;
    }

    // Testing support for dragging and dropping images
    // from other browser windows
    let url;

    let html = this[DATA_TRANSFER].getData('text/html');
    if (html) {
      let img = $(html)[1];
      if (img.tagName === 'IMG') {
        url = img.src;
      }
    }

    if (url == null) {
      url = this[DATA_TRANSFER].getData('text/uri-list');
    }

    if (url) {
      var image = new Image();
      var [filename] = url.split('/').slice(-1);
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            let [file] = get(this, 'queue')._addFiles([blob], 'web');
            set(file, 'name', filename);
          });
        } else {
          let binStr = atob(canvas.toDataURL().split(',')[1]),
              len = binStr.length,
              arr = new Uint8Array(len);

          for (var i=0; i<len; i++ ) {
            arr[i] = binStr.charCodeAt(i);
          }
          let blob = new Blob([arr], { type: 'image/png' });
          blob.name = filename;
          let [file] = get(this, 'queue')._addFiles([blob], 'web');
          set(file, 'name', filename);
        }
      };
      /* eslint-disable no-console */
      image.onerror = function (e) {
        console.log(e);
      };
      /* eslint-enable no-console */
      image.src = url;
    }

    if (this.ondrop) {
      this.ondrop(this[DATA_TRANSFER]);
    }

    // Add file(s) to upload queue.
    set(this, 'active', false);
    get(this[DATA_TRANSFER], 'files').then((files) => {
      get(this, 'queue')._addFiles(files, 'drag-and-drop');
      this[DATA_TRANSFER] = null;
    });
  }
});
