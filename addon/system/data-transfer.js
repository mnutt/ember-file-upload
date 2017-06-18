import Ember from 'ember';
import trim from './trim';
import readDataTransfer from './data-transfer-reader';

const { get, computed } = Ember;

const getDataSupport = {};

export default Ember.Object.extend({

  dataTransfer: null,

  queue: null,

  getData(type) {
    let dataTransfer = get(this, 'dataTransfer');
    if (getDataSupport[type] == null) {
      try {
        let data = dataTransfer.getData(type);
        getDataSupport[type] = true;
        return data;
      } catch (e) {
        getDataSupport[type] = false;
      }
    } else if (getDataSupport[type]) {
      return dataTransfer.getData(type);
    }
  },

  valid: computed('dataTransfer.files', 'files', {
    get() {
      return get(this, 'files').then((files) => {
        if (files == null) {
          return true;
        }

        return (
          get(this, 'dataTransfer.items.length') ||
            get(this, 'dataTransfer.files.length')
        ) === files.length;
      });
    }
  }),

  files: computed('queue.multiple', 'queue.accept', 'dataTransfer', {
    get() {
      return readDataTransfer(get(this, 'dataTransfer')).then((files) => {
        if (!get(this, 'queue.multiple') && files && files.length > 1) {
          files = [files[0]];
        }

        let accept = get(this, 'queue.accept');
        if (accept == null) {
          return files;
        }

        let tokens = Ember.A(accept.split(',').map(function (token) {
          return trim(token).toLowerCase();
        }));
        let extensions = Ember.A(tokens.filter(function (token) {
          return token.indexOf('.') === 0;
        }));
        let mimeTypes = Ember.A(Ember.A(tokens.filter(function (token) {
          return token.indexOf('.') !== 0;
        })).map(function (mimeType) {
          return new RegExp(mimeType);
        }));

        return files.filter(function (file) {
          let extension = null;
          if (file.name && /(\.[^.]+)$/.test(file.name)) {
            extension = file.name.toLowerCase().match(/(\.[^.]+)$/)[1];
          }

          let type = file.type.toLowerCase();
          return mimeTypes.find(function (mimeType) {
            return mimeType.test(type);
          }) || extensions.indexOf(extension) !== -1;
        });
      });
    }
  })
});
