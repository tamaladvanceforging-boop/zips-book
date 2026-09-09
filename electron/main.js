const { app, BrowserWindow, Menu, ipcMain, shell, utilityProcess } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

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
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, "zips_book_data.db");

  // Multi-candidate search for template DB
  const candidateTemplates = [
    path.join(process.resourcesPath || "", "app/prisma/dev.db"),
    path.join(process.resourcesPath || "", "app.asar.unpacked/prisma/dev.db"),
    path.join(process.resourcesPath || "", "prisma/dev.db"),
    path.join(__dirname, "../prisma/dev.db"),
    path.join(__dirname, "../.next/standalone/prisma/dev.db"),
    path.join(__dirname, "../../prisma/dev.db"),
    path.join(process.cwd(), "prisma/dev.db"),
  ];

  let templateDb = candidateTemplates.find((p) => p && fs.existsSync(p));
  logDesktop(`Resolved template DB: ${templateDb || "NONE"}`);
  logDesktop(`Target DB path: ${dbPath}`);

  if (!fs.existsSync(dbPath)) {
    if (templateDb && fs.existsSync(templateDb)) {
      try {
        fs.copyFileSync(templateDb, dbPath);
        logDesktop(`Successfully copied template DB from ${templateDb} to ${dbPath}`);
      } catch (err) {
        logDesktop(`Failed to copy template DB: ${err.message}`);
        console.error("Failed to copy template database:", err);
      }
    } else {
      logDesktop(`Warning: Template DB not found in candidate paths.`);
    }
  } else {
    logDesktop(`Database already exists at ${dbPath}`);
  }

  // Multi-candidate search for standalone server.js
  const candidateServers = [
    path.join(process.resourcesPath || "", "app/.next/standalone/server.js"),
    path.join(process.resourcesPath || "", "app.asar.unpacked/.next/standalone/server.js"),
    path.join(__dirname, "../.next/standalone/server.js"),
    path.join(__dirname, "../../.next/standalone/server.js"),
    path.join(process.cwd(), ".next/standalone/server.js"),
  ];

  let standaloneServer = candidateServers.find((p) => p && fs.existsSync(p));
  if (!standaloneServer) {
    standaloneServer = path.join(__dirname, "../.next/standalone/server.js");
  }

  const formattedDbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "localhost",
    NODE_ENV: "production",
    DATABASE_URL: formattedDbUrl,
  };

  logDesktop(`Starting standalone server via utilityProcess: ${standaloneServer}`);

  try {
    serverProcess = utilityProcess.fork(standaloneServer, [], {
      env,
      cwd: path.dirname(standaloneServer),
      stdio: "pipe",
    });

    serverProcess.on("spawn", () => {
      logDesktop("UtilityProcess server spawned successfully");
    });

    serverProcess.stdout?.on("data", (chunk) => {
      logDesktop(`[Server STDOUT] ${chunk.toString().trim()}`);
    });

    serverProcess.stderr?.on("data", (chunk) => {
      logDesktop(`[Server STDERR] ${chunk.toString().trim()}`);
    });

    serverProcess.on("error", (err) => {
      logDesktop(`UtilityProcess error: ${err.message || err}`);
      console.error("Production server process error:", err);
    });

    serverProcess.on("exit", (code) => {
      logDesktop(`UtilityProcess server exited with code: ${code}`);
    });
  } catch (spawnErr) {
    logDesktop(`Failed to fork utilityProcess: ${spawnErr.message}`);
    console.error("Failed to fork utilityProcess:", spawnErr);
  }
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
    logDesktop(`Error loading server: ${err.message || err}`);
    try {
      await mainWindow.loadURL(`${targetUrl}/auth/login`);
    } catch (retryErr) {
      logDesktop(`Error loading auth/login fallback: ${retryErr.message || retryErr}`);
      try {
        const errHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>ZIPS-Book ERP Startup</title>
            <style>
              body { background: #090d16; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #0f172a; border: 1px solid #1e293b; padding: 2.5rem; border-radius: 1rem; max-width: 500px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
              h2 { color: #10b981; margin-bottom: 0.5rem; font-size: 1.5rem; }
              p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
              button { margin-top: 1.5rem; background: #059669; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
              button:hover { background: #047857; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>ZIPS-Book Enterprise ERP</h2>
              <p>Starting local accounting service and database...</p>
              <p style="font-size: 0.8rem; color: #64748b;">Please wait a moment or click Retry below.</p>
              <button onclick="window.location.href='${targetUrl}'">Retry Connection</button>
            </div>
          </body>
          </html>
        `;
        await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errHtml)}`);
      } catch {}
    }
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
    try {
      serverProcess.kill();
    } catch {}
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
