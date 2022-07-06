const { contextBridge, ipcRenderer } = require("electron");
/* Buttons */
contextBridge.exposeInMainWorld("ipc", {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
});

//window.jQuery = window.$ = require('./jquery-3.3.1.min.js');
//window.jQuery = window.$ = require('./assets/lib/js/jquery-2.2.4.min.js');