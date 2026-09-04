const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openStatementFile: () => ipcRenderer.invoke('dialog:openStatementFile'),
  isDesktop: true,
});
