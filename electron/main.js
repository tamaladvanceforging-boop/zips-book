const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

let mainWindow = null;
let serverProcess = null;
const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";
const DEV_PORT = process.env.PORT || 3000;

const logDesktop = (msg) => {
  try {
    const userDataPath = app.getPath("userData");
    const logDir = path.join(userDataPath, "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(path.join(logDir, "desktop.log"), `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
};

// Poll local URL until Next.js server is ready
const waitForServer = (url, timeoutMs = 45000) => {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      });

      req.on("error", () => {
        retry();
      });

      req.end();
    };

    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        logDesktop(`Timeout waiting for server at ${url}`);
        reject(new Error(`Timeout waiting for server at ${url}`));
      } else {
        setTimeout(check, 800);
      }
    };

    check();
  });
};

// Start standalone Next.js server in production mode
const startProductionServer = (port) => {
  const userDataPath = app.getPath("userData");
  const dbDir = path.join(userDataPath, "databases");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "zips_book_data.db");

  // Locate template DB
  let templateDb = path.join(__dirname, "../prisma/dev.db");
  if (app.isPackaged) {
    const unpackedDb = path.join(process.resourcesPath, "app.asar.unpacked/prisma/dev.db");
    const directDb = path.join(process.resourcesPath, "app/prisma/dev.db");
    if (fs.existsSync(unpackedDb)) {
      templateDb = unpackedDb;
    } else if (fs.existsSync(directDb)) {
      templateDb = directDb;
    }
  }

  if (!fs.existsSync(dbPath) && fs.existsSync(templateDb)) {
    try {
      fs.copyFileSync(templateDb, dbPath);
    } catch (err) {
      console.error("Failed to copy template database:", err);
    }
  }

  let standaloneServer = path.join(__dirname, "../.next/standalone/server.js");
  if (app.isPackaged) {
    const unpackedServer = path.join(process.resourcesPath, "app.asar.unpacked/.next/standalone/server.js");
    const directServer = path.join(process.resourcesPath, "app/.next/standalone/server.js");
    if (fs.existsSync(unpackedServer)) {
      standaloneServer = unpackedServer;
    } else if (fs.existsSync(directServer)) {
      standaloneServer = directServer;
    }
  }

  const formattedDbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "localhost",
    NODE_ENV: "production",
    DATABASE_URL: formattedDbUrl,
    ELECTRON_RUN_AS_NODE: "1",
  };

  serverProcess = spawn(process.execPath, [standaloneServer], {
    env,
    stdio: "inherit",
    cwd: path.dirname(standaloneServer),
  });

  serverProcess.on("error", (err) => {
    console.error("Production server process error:", err);
  });
};

// Build application native top menu
const createApplicationMenu = () => {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Enterprise Gateway",
          accelerator: "Alt+G",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(
                `window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))`
              );
            }
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Vouchers",
      submenu: [
        {
          label: "Sales Invoice (F8)",
          accelerator: "F8",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(
                isDev
                  ? `http://localhost:${DEV_PORT}/vouchers/sales`
                  : `http://localhost:${DEV_PORT}/vouchers/sales`
              );
            }
          },
        },
        {
          label: "Purchase Bill (F9)",
          accelerator: "F9",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(
                isDev
                  ? `http://localhost:${DEV_PORT}/vouchers/purchase`
                  : `http://localhost:${DEV_PORT}/vouchers/purchase`
              );
            }
          },
        },
        {
          label: "Payment Voucher (F5)",
          accelerator: "F5",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(
                isDev
                  ? `http://localhost:${DEV_PORT}/vouchers/payment`
                  : `http://localhost:${DEV_PORT}/vouchers/payment`
              );
            }
          },
        },
        {
          label: "Receipt Voucher (F6)",
          accelerator: "F6",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(
                isDev
                  ? `http://localhost:${DEV_PORT}/vouchers/receipt`
                  : `http://localhost:${DEV_PORT}/vouchers/receipt`
              );
            }
          },
        },
        {
          label: "Contra Voucher (F4)",
          accelerator: "F4",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(
                isDev
                  ? `http://localhost:${DEV_PORT}/vouchers/contra`
                  : `http://localhost:${DEV_PORT}/vouchers/contra`
              );
            }
          },
        },
        {
          label: "Journal Voucher (F7)",
          accelerator: "F7",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(
                isDev
                  ? `http://localhost:${DEV_PORT}/vouchers/journal`
                  : `http://localhost:${DEV_PORT}/vouchers/journal`
              );
            }
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Documentation & GitHub",
          click: () => {
            shell.openExternal("https://github.com/tamaladvanceforging-boop/zips-book");
          },
        },
        {
          label: "About ZIPS-Book ERP",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(
                `alert("ZIPS-Book Enterprise ERP v1.0.0\\nAuthor: Tamal Roy Chowdhury\\nProprietary Software (c) 2026")`
              );
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Create main native window
const createMainWindow = async () => {
  let targetUrl = `http://localhost:${DEV_PORT}`;

  if (!isDev) {
    const prodPort = 34567;
    startProductionServer(prodPort);
    targetUrl = `http://localhost:${prodPort}`;
  }

  const iconPath = path.join(__dirname, "../public/favicon.ico");

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "ZIPS-Book Enterprise ERP",
    backgroundColor: "#090d16",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  createApplicationMenu();

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      if (isDev) {
        // mainWindow.webContents.openDevTools();
      }
    }
  });

  try {
    await waitForServer(targetUrl);
    await mainWindow.loadURL(targetUrl);
  } catch (err) {
    console.error("Error loading server:", err);
    await mainWindow.loadURL(targetUrl);
  }

  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// IPC listeners for desktop operations
ipcMain.on("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("window-close", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on("print-invoice", () => {
  if (mainWindow) {
    mainWindow.webContents.print({ silent: false, printBackground: true });
  }
});

// App Lifecycle
app.whenReady().then(createMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill("SIGINT");
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
