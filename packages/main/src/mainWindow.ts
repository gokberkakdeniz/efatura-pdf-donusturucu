import { BrowserWindow } from "electron";
import { join } from "path";
import { URL } from "url";

async function createWindow() {
  const browserWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nativeWindowOpen: true,
      webviewTag: false,
      preload: join(__dirname, "../../preload/dist/index.cjs"),
    },
    minHeight: 400,
    minWidth: 400,
  });

  browserWindow.on("ready-to-show", () => {
    browserWindow?.show();

    if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools();
    }
  });

  const pageUrl =
    import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
      ? import.meta.env.VITE_DEV_SERVER_URL
      : new URL(
          "../renderer/dist/index.html",
          "file://" + __dirname
        ).toString();

  await browserWindow.loadURL(pageUrl);

  return browserWindow;
}

export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find(
    (w) => w.title !== "worker" && !w.isDestroyed()
  );

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
}
