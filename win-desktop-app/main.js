const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = require('is-dev');
const waitOn = require('wait-on');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, '..', 'client', 'public', 'assets', 'favicon.png'),
        autoHideMenuBar: true
    });


    const port = process.env.PORT || 5000;
    const targetUrl = isDev ? 'http://localhost:5173' : `http://localhost:${port}`;

    if (isDev) {

        waitOn({ resources: ['tcp:5173'], timeout: 30000 })
            .then(() => mainWindow.loadURL(targetUrl))
            .catch(err => console.error('Error waiting for frontend:', err));
    } else {

        waitOn({ resources: [`tcp:${port}`], timeout: 30000 })
            .then(() => {

                mainWindow.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
            })
            .catch(err => console.error('Error waiting for backend:', err));
    }
}

app.whenReady().then(() => {

    const serverPath = path.join(__dirname, '..', 'server', 'server.js');
    serverProcess = spawn('node', [serverPath], {
        env: { ...process.env, IS_ELECTRON: 'true' },
        stdio: 'inherit'
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
