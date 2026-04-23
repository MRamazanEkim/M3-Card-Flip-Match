const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const APP_ICON = path.join(__dirname, 'app_icon.ico');

// Prevent Chromium from throttling timers when window is unfocused/occluded.
// Game uses setInterval for countdown and setTimeout for popup -> welcome transition;
// throttling caused stuck popup and late screen change after idle.
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

const PASSWORD_URL = 'https://www.m3.com.tr/gamepass.txt';

let mainWindow;
let passwordWindow;

// AppData/Roaming/<AppName>/saved_password.dat yolu
function getPasswordFilePath() {
  const userDataPath = app.getPath('userData'); // Windows: C:\Users\<user>\AppData\Roaming\<AppName>
  return path.join(userDataPath, 'saved_password.dat');
}

// Uzaktaki şifreyi indir
function fetchRemotePassword() {
  return new Promise((resolve, reject) => {
    https.get(PASSWORD_URL, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data.trim()); // Örn: "m32005"
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Kayıtlı şifreyi oku (varsa)
function readSavedPassword() {
  const filePath = getPasswordFilePath();
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8').trim();
  }
  return null;
}

// Kayıtlı şifreyi kaydet
function savePassword(password) {
  const filePath = getPasswordFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, password, 'utf8');
}

// Ana uygulama penceresi
function createMainWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    icon: APP_ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      webSecurity: true,
      backgroundThrottling: false,
    }
  });

  mainWindow.loadFile('index.html');

  //  Set zoom to 75%
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(0.75);
  });

  //  Toggle fullscreen with ESC
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape') {
      const isFullScreen = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFullScreen);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Şifre soran pencere
function createPasswordWindow() {
  passwordWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Şifre Girişi',
    icon: APP_ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  passwordWindow.loadFile('password.html');

  passwordWindow.on('closed', () => {
    passwordWindow = null;
  });
}

// Uygulama başlarken önce şifre durumunu kontrol et
async function startAppWithPasswordCheck() {
  try {
    const saved = readSavedPassword();
    const remote = await fetchRemotePassword();

    // Daha önce kaydedilmiş şifre var ve uzaktaki ile aynıysa direkt aç
    if (saved && saved === remote) {
      createMainWindow();
    } else {
      createPasswordWindow();
    }
  } catch (err) {
    // İnternete ulaşılamazsa veya hata olursa güvenlik için şifre sor
    console.error('Şifre kontrolü sırasında hata:', err);
    createPasswordWindow();
  }
}

// Renderer'dan gelen şifreyi kontrol et
ipcMain.on('check-password', async (event, enteredPassword) => {
  try {
    const remote = await fetchRemotePassword();

    if (enteredPassword && enteredPassword.trim() === remote) {
      // Doğru şifre
      savePassword(enteredPassword.trim());

      if (passwordWindow) {
        passwordWindow.close();
      }

      createMainWindow();
      event.reply('check-password-result', { success: true });
    } else {
      // Yanlış şifre
      event.reply('check-password-result', { success: false, message: 'Hatalı şifre' });
    }
  } catch (err) {
    console.error('Şifre doğrulama hatası:', err);
    event.reply('check-password-result', { success: false, message: 'Bağlantı hatası' });
  }
});

// Electron lifecycle
app.whenReady().then(startAppWithPasswordCheck);

app.on('window-all-closed', () => {
  // İsterseniz burada app.quit() kullanabilirsiniz (Windows için)
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    startAppWithPasswordCheck();
  }
});