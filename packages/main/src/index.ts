import { app } from "electron";
import "./security-restrictions";
import { restoreOrCreateWindow } from "/@/mainWindow";
import { createWorker } from "./worker";
import pkg from "../../../package.json";

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
app.on("second-instance", restoreOrCreateWindow);

app.disableHardwareAcceleration();

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.setName(pkg.build.productName);

app.on("activate", restoreOrCreateWindow);

app
  .whenReady()
  .then(() => {
    restoreOrCreateWindow();
    createWorker();
  })
  .catch((e) => console.error("Failed create window:", e));

if (import.meta.env.DEV) {
  app
    .whenReady()
    .then(() => import("electron-devtools-installer"))
    .catch((e) => console.error("Failed install extension:", e));
}

if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => import("electron-updater"))
    .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
    .catch((e) => console.error("Failed check updates:", e));
}
