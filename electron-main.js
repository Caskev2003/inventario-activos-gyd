const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const os = require("os");

app.setPath(
  "userData",
  path.join(os.homedir(), "AppData", "Roaming", "InventarioActivosGYD")
);

let mainWindow;
let nextProcess;

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/login`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "DISTRIBUCIÓN G&D - INVENTARIO DE ACTIVOS",
    autoHideMenuBar: true,
    backgroundColor: "#2b2b2b",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "build", "icon.ico"),
  });

  mainWindow.webContents.session.clearCache().then(() => {
    mainWindow.loadURL(BASE_URL);
  });

  mainWindow.webContents.on("did-fail-load", (_, code, desc) => {
    console.error("Error cargando Electron:", code, desc);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Electron cargó:", BASE_URL);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function isServerUp() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(Boolean(res.statusCode && res.statusCode < 500));
    });

    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(maxRetries = 30, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    const up = await isServerUp();
    if (up) return true;
    await new Promise((r) => setTimeout(r, delay));
  }
  return false;
}

function startNextServer() {
  nextProcess = spawn("cmd", ["/c", "npm", "start"], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(PORT),
      USER_DATA_PATH: path.join(
        os.homedir(),
        "AppData",
        "Roaming",
        "InventarioActivosGYD"
      ),
    },
    windowsHide: true,
  });

  nextProcess.stdout.on("data", (data) => {
    console.log(`[Next.js]: ${data}`);
  });

  nextProcess.stderr.on("data", (data) => {
    console.error(`[Next.js error]: ${data}`);
  });
}

app.whenReady().then(async () => {
  const alreadyRunning = await isServerUp();

  if (!alreadyRunning) {
    startNextServer();
    const ready = await waitForServer();

    if (!ready) {
      console.error("Next.js no respondió a tiempo");
      app.quit();
      return;
    }
  }

  createWindow();
});

app.on("window-all-closed", () => {
  if (nextProcess) {
    nextProcess.kill();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});