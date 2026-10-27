import {join} from 'node:path'

import { app, BrowserWindow } from 'electron'

function createWindow() {
  const mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
    },
  })
  mainWindow.maximize();
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  if(process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  }
  else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)