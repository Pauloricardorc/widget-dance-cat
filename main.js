const { app, BrowserWindow, screen, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let tray = null; // Variável global para a bandeja
let win = null; // Referência global para a janela
let mascoteClicavel = true; // Estado do modo clicável

// Configuração do autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Função para verificar atualizações
function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
}

// Eventos do autoUpdater
autoUpdater.on('update-available', () => {
  win.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  win.webContents.send('update-downloaded');
});

function updateTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar Mascote', click: () => win.show() },
    { label: 'Ocultar Mascote', click: () => win.hide() },
    { type: 'separator' },
    {
      label: 'Mascote clicável',
      type: 'checkbox',
      checked: mascoteClicavel,
      click: () => {
        mascoteClicavel = !mascoteClicavel;
        win.setIgnoreMouseEvents(!mascoteClicavel, { forward: true });
        updateTrayMenu();
      }
    },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() }
  ]);
  tray.setContextMenu(contextMenu);
}

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = 300;
  const winHeight = 300;
  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: screenWidth - winWidth,
    y: screenHeight - winHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');

  // Adiciona o ícone na bandeja
  if (!tray) {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    tray.setToolTip('Mascote');
    updateTrayMenu();
    tray.on('click', () => {
      win.isVisible() ? win.hide() : win.show();
    });
  }

  // Atalho para alternar alwaysOnTop
  globalShortcut.register('Control+Shift+T', () => {
    const current = win.isAlwaysOnTop();
    win.setAlwaysOnTop(!current);
  });

  // Inicialmente, mascote é clicável
  win.setIgnoreMouseEvents(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 