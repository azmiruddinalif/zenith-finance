const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#070A0F',
    title: 'Zenith Finance - Intelligent Personal Wealth & Expense Engine',
    icon: path.join(__dirname, '../client/public/logo.jpg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load local Vite dev server or production build
  const devUrl = 'http://localhost:5173';
  win.loadURL(devUrl).catch(() => {
    // If dev server is not ready yet, retry in 2s
    setTimeout(() => win.loadURL(devUrl), 2000);
  });

  // Remove default menu for a clean modern frameless/fintech look
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Native Desktop File Dialog for CSV / Excel statement selection
ipcMain.handle('dialog:openStatementFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Bank Statements & Spreadsheets', extensions: ['csv', 'xlsx', 'xls'] }
    ]
  });

  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});
