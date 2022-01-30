import { contextBridge, ipcRenderer } from "electron";
import type { Task, TaskResult } from "/@shared/worker";
import { join, dirname, basename, extname } from "path";
import { lstat } from "fs/promises";

const workerAdd = (task: Task): number =>
  ipcRenderer.sendSync("workerAdd", task);
contextBridge.exposeInMainWorld("workerAdd", workerAdd);

const workerDel = (taskId: number): boolean =>
  ipcRenderer.sendSync("workerDel", taskId);
contextBridge.exposeInMainWorld("workerDel", workerDel);

const workerStart = () => ipcRenderer.send("workerStart");
contextBridge.exposeInMainWorld("workerStart", workerStart);

const workerOnStart = (callback: () => void) => {
  ipcRenderer.on("workerOnStart", () => callback());
};
contextBridge.exposeInMainWorld("workerOnStart", workerOnStart);

const workerStop = () => ipcRenderer.send("workerStop");
contextBridge.exposeInMainWorld("workerStop", workerStop);

const workerOnStop = (callback: () => void) => {
  ipcRenderer.on("workerOnStop", () => callback());
};
contextBridge.exposeInMainWorld("workerOnStop", workerOnStop);

const workerOnTaskComplete = (callback: (res: TaskResult) => void) => {
  ipcRenderer.on("workerOnTaskComplete", (_, t) => callback(t));
};
contextBridge.exposeInMainWorld("workerOnTaskComplete", workerOnTaskComplete);

contextBridge.exposeInMainWorld("path", { join, dirname, basename, extname });

const isFile = (path: string) => lstat(path).then((s) => s.isFile());
contextBridge.exposeInMainWorld("fs", { isFile });
