"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow, dialog, Menu, nativeImage, nativeTheme, session } = require("electron");
const { autoUpdater } = require("electron-updater");

const KEYCHRON_LAUNCHER_URL = "https://launcher.keychron.com";
const APP_NAME = "Keychron Launcher Wrapper";
const APP_WINDOW_TITLE = "Keychron Launcher Wrapper";
const DEBUG_LOGS = process.env.KEYCHRON_DEBUG === "1";
const FORCE_DEVTOOLS = process.env.KEYCHRON_DEVTOOLS === "1";
const APP_ICON_PATH = path.join(__dirname, "..", "assets", "keychron-launcher-wrapper.png");

app.setName(APP_NAME);

// Add only domains that are required by the Keychron Launcher website.
const ALLOWED_HOST_PATTERNS = [
  "launcher.keychron.com",
  "keychron.com",
  "www.keychron.com",
  "*.keychron.com"
];

const EXTRA_ALLOWED_HOSTS = (process.env.KEYCHRON_ALLOWED_HOSTS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

let mainWindow = null;
let interactiveUpdateCheck = false;

function getAppIconImage() {
  if (!fs.existsSync(APP_ICON_PATH)) {
    return undefined;
  }

  const icon = nativeImage.createFromPath(APP_ICON_PATH);
  return icon.isEmpty() ? undefined : icon;
}

function logDebug(message, meta) {
  if (!DEBUG_LOGS) {
    return;
  }

  if (meta === undefined) {
    console.log(`[keychron-wrapper] ${message}`);
    return;
  }

  console.log(`[keychron-wrapper] ${message}`, meta);
}

function matchesHostPattern(hostname, pattern) {
  if (pattern.startsWith("*.")) {
    const bare = pattern.slice(2);
    return hostname === bare || hostname.endsWith(`.${bare}`);
  }

  return hostname === pattern;
}

function isAllowedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") {
      return false;
    }

    return [...ALLOWED_HOST_PATTERNS, ...EXTRA_ALLOWED_HOSTS].some((pattern) =>
      matchesHostPattern(url.hostname, pattern)
    );
  } catch {
    return false;
  }
}

function configureHidAndPermissions() {
  const appSession = session.defaultSession;

  appSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    logDebug("permission-check", {
      permission,
      requestingOrigin,
      securityOrigin: details && details.securityOrigin
    });

    if (permission !== "hid") {
      return false;
    }

    if (!isAllowedUrl(requestingOrigin)) {
      return false;
    }

    if (details && details.securityOrigin && !isAllowedUrl(details.securityOrigin)) {
      return false;
    }

    return true;
  });

  appSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const url = (details && (details.requestingUrl || details.requestingOrigin)) || "";

    logDebug("permission-request", {
      permission,
      url,
      rawDetails: details ? Object.keys(details) : null
    });

    if (permission !== "hid") {
      callback(false);
      return;
    }

    const allowed = isAllowedUrl(url);
    logDebug("permission-request-result", { url, allowed });
    callback(allowed);
  });

  appSession.setDevicePermissionHandler((details) => {
    logDebug("device-permission", {
      deviceType: details && details.deviceType,
      origin: details && details.origin,
      deviceName: details && details.device && details.device.name,
      vendorId: details && details.device && details.device.vendorId,
      productId: details && details.device && details.device.productId
    });

    if (details.deviceType !== "hid") {
      return false;
    }

    if (!details.origin || !isAllowedUrl(details.origin)) {
      return false;
    }

    return true;
  });

  appSession.on("select-hid-device", (event, details, callback) => {
    const deviceList = (details && details.deviceList) || [];

    logDebug("select-hid-device", {
      hasFrame: !!(details && details.frame),
      frameUrl: details && details.frame && details.frame.url,
      detailsKeys: details ? Object.keys(details) : null,
      devices: deviceList.length,
      deviceList:
        deviceList.map((d) => ({
          name: d.name,
          productId: d.productId,
          vendorId: d.vendorId,
          deviceId: d.deviceId
        }))
    });

    if (details.frame && !isAllowedUrl(details.frame.url)) {
      logDebug("select-hid-device-blocked", { frameUrl: details.frame.url });
      event.preventDefault();
      callback("");
      return;
    }

    event.preventDefault();

    if (deviceList.length === 0) {
      logDebug("select-hid-device-empty", { filters: details.filters });
      callback("");
      dialog.showMessageBox({
        type: "warning",
        title: "No HID Devices Found",
        message: "No HID devices were detected.",
        detail: "Make sure your keyboard is connected via USB cable.",
        buttons: ["OK"]
      });
      return;
    }

    // Prefer Keychron-branded devices (vendorId 0x3434 = 13364)
    const keychronDevice = deviceList.find((d) => d.vendorId === 13364);
    if (keychronDevice) {
      logDebug("select-hid-device-auto", { name: keychronDevice.name, vendorId: keychronDevice.vendorId });
      callback(keychronDevice.deviceId);
      return;
    }

    if (deviceList.length === 1) {
      callback(deviceList[0].deviceId);
      return;
    }

    callback("");
  });
}

function hardenNavigation(win) {
  win.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedUrl(url)) {
      logDebug("blocked-navigation", { url });
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    logDebug("window-open", { url, allowed: isAllowedUrl(url) });

    if (isAllowedUrl(url)) {
      win.loadURL(url);
    }

    return { action: "deny" };
  });

}

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (attachEvent) => {
    // No embedded webviews allowed in this dedicated wrapper.
    attachEvent.preventDefault();
  });
});

async function maybeShowConnectionHint() {
  const appIcon = getAppIconImage();
  const result = await dialog.showMessageBox({
    type: "info",
    title: "Keychron Launcher Wrapper",
    message: "Connect your keyboard by cable before continuing.",
    icon: appIcon,
    buttons: ["Continue", "Quit"],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  });

  if (result.response === 1) {
    app.quit();
    return false;
  }

  return true;
}

async function validateHidAvailability(win) {
  const appIcon = getAppIconImage();
  try {
    const hasHid = await win.webContents.executeJavaScript("typeof navigator.hid !== 'undefined'", true);
    if (!hasHid) {
      await dialog.showMessageBox(win, {
        type: "warning",
        title: "WebHID Not Available",
        message: "navigator.hid is not available in this session.",
        icon: appIcon,
        detail: "Try updating Electron or check macOS security permissions for USB/HID access."
      });
    }
  } catch (error) {
    await dialog.showMessageBox(win, {
      type: "error",
      title: "Validation Error",
      message: "Failed to validate WebHID availability.",
      icon: appIcon,
      detail: String(error)
    });
  }
}

function getWindowBackgroundColor() {
  return nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#f2f2f2";
}

function applyMacWindowAppearance(win) {
  if (process.platform !== "darwin" || !win || win.isDestroyed()) {
    return;
  }

  win.setBackgroundColor(getWindowBackgroundColor());
}

function createMainWindow() {
  const windowOptions = {
    title: APP_WINDOW_TITLE,
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: getWindowBackgroundColor(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged || FORCE_DEVTOOLS
    }
  };

  if (fs.existsSync(APP_ICON_PATH)) {
    windowOptions.icon = APP_ICON_PATH;
  }

  if (process.platform === "darwin") {
    windowOptions.titleBarStyle = "default";
  }

  mainWindow = new BrowserWindow(windowOptions);
  applyMacWindowAppearance(mainWindow);

  hardenNavigation(mainWindow);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", () => {
    logDebug("did-finish-load", { url: mainWindow.webContents.getURL() });
    validateHidAvailability(mainWindow);
  });

  mainWindow.webContents.on("console-message", (event) => {
    logDebug("renderer-console", {
      level: event.level,
      message: event.message,
      line: event.line,
      sourceId: event.sourceId
    });
  });

  mainWindow.on("page-title-updated", (event) => {
    event.preventDefault();
    mainWindow.setTitle(APP_WINDOW_TITLE);
  });

  mainWindow.loadURL(KEYCHRON_LAUNCHER_URL);
}

function showUpdateMessage(options) {
  const messageOptions = { icon: getAppIconImage(), ...options };
  const window = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  return window ? dialog.showMessageBox(window, messageOptions) : dialog.showMessageBox(messageOptions);
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    logDebug("auto-updater-checking");
  });

  autoUpdater.on("update-available", (info) => {
    logDebug("auto-updater-update-available", { version: info.version });
    if (interactiveUpdateCheck) {
      showUpdateMessage({
        type: "info",
        title: "Update Available",
        message: `Version ${info.version} is available.`,
        detail: "The update will be downloaded in the background."
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    logDebug("auto-updater-update-not-available");
    if (interactiveUpdateCheck) {
      showUpdateMessage({
        type: "info",
        title: "No Updates Available",
        message: "You are running the latest version."
      });
    }
    interactiveUpdateCheck = false;
  });

  autoUpdater.on("update-downloaded", async (info) => {
    logDebug("auto-updater-update-downloaded", { version: info.version });
    interactiveUpdateCheck = false;

    const result = await showUpdateMessage({
      type: "info",
      title: "Update Ready",
      message: `Version ${info.version} has been downloaded.`,
      detail: "Restart the app to install the update.",
      buttons: ["Restart and Install", "Later"],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on("error", (error) => {
    logDebug("auto-updater-error", { error: String(error) });
    if (interactiveUpdateCheck) {
      showUpdateMessage({
        type: "error",
        title: "Update Check Failed",
        message: "Could not check for updates.",
        detail: String(error)
      });
    }
    interactiveUpdateCheck = false;
  });

  if (app.isPackaged) {
    logDebug("auto-updater", { checking: true });
    autoUpdater.checkForUpdates().catch((error) => {
      logDebug("auto-updater-error", { error: String(error) });
    });
  }
}

function checkForUpdates() {
  if (!app.isPackaged) {
    showUpdateMessage({
      type: "info",
      title: "Updates Unavailable",
      message: "Auto-update checks are only available in packaged builds."
    });
    return;
  }

  interactiveUpdateCheck = true;
  autoUpdater.checkForUpdates().catch((error) => {
    logDebug("auto-updater-error", { error: String(error) });
  });
}

function buildAppMenu() {
  const template = [
    {
      label: APP_NAME,
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Check for Updates...",
          click: checkForUpdates
        },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  if (process.platform === "darwin" && fs.existsSync(APP_ICON_PATH)) {
    const dockIcon = nativeImage.createFromPath(APP_ICON_PATH);
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon);
    }
  }

  buildAppMenu();

  configureHidAndPermissions();

  const shouldContinue = await maybeShowConnectionHint();
  if (!shouldContinue) {
    return;
  }

  createMainWindow();

  setupAutoUpdater();

  nativeTheme.on("updated", () => {
    applyMacWindowAppearance(mainWindow);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
