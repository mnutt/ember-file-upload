import Ember from 'ember';

const { get } = Ember;
const { Promise } = Ember.RSVP;

export default function read(dataTransfer) {
  if (!dataTransfer) {
    return new Promise((resolve) => { resolve(null); });
  }

  let fileList = get(dataTransfer, 'files');
  let itemList = get(dataTransfer, 'items');

  const supportsDirectoryDrop = typeof DataTransferItemList !== 'undefined' &&
        itemList instanceof DataTransferItemList;

  if ((fileList == null && itemList) ||
      (itemList != null && fileList != null &&
       itemList.length > fileList.length)) {
    fileList = itemList;
  }

  if (!supportsDirectoryDrop) {
    return readFileList(fileList);
  } else {
    return readItemList(itemList);
  }
}

function readFileList(fileList) {
  return new Promise((resolve, reject) => {
    if (fileList == null) {
      reject('empty file list');
    } else {
      let files = Ember.A();
      for(let i = 0, len = fileList.length; i < len; i++) {
        files.push(fileList[i]);
      }
      resolve(files);
    }
  });
}

function readItemList(itemList) {
  return new Promise((resolve, reject) => {
    let files = Ember.A();

    let count = itemList.length || itemList.size;
    let processed = 0;

    function addEntry(file) {
      let entry = file;
      if (file.getAsEntry) {
        entry = file.getAsEntry();
      } else if (file.webkitGetAsEntry) {
        entry = file.webkitGetAsEntry();
      }

      if (entry.isFile) {
        entry.file(function (file) {
          file.fullPath = entry.fullPath;
          files.push(file);
          tryResolve();
        });
      } else if (entry.isDirectory) {
        entry.createReader().readEntries(function (entries) {
          count += entries.length;
          entries.forEach(addEntry);

          tryResolve();
        });
      }
    }

    function tryResolve() {
      processed++;

      if(processed === count) {
        if(count === 0) {
          reject('empty file list');
        } else {
          resolve(files);
        }
      }
    }

    for(let i = 0, len = itemList.length; i < len; i++) {
      addEntry(itemList[i]);
    }
  });
}
