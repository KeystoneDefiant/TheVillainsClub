const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("clubDesktop", {
  platform: process.platform,
});
