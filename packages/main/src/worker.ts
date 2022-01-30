import { BrowserWindow, ipcMain } from "electron";
import { writeFile, mkdtemp, rm } from "fs/promises";
import * as StreamZip from "node-stream-zip";
import type {
  Task,
  TaskWithId,
  SuccessTaskResult,
  FailedTaskResult,
  TaskCallback,
} from "/@shared/worker";
import { tmpdir } from "os";
import { basename, extname, join } from "path";

export class PDFWorker {
  #workerWindow: BrowserWindow;
  #tasks: TaskWithId[] = [];
  #stopRequested = false;
  #isRunning = false;
  #index = -1;

  constructor() {
    this.#workerWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nativeWindowOpen: true,
        webviewTag: false,
      },
      title: "worker",
    });
    this.#workerWindow.webContents.session.on("will-download", (e) => {
      e.preventDefault();
    });
  }

  add = (task: Task): number => {
    if (
      this.#tasks.find(
        (t) => t.input === task.input && t.output === task.output
      )
    )
      return -1;

    this.#tasks.push({ ...task, id: ++this.#index });

    return this.#index;
  };

  delete = (id: number): boolean => {
    const index = this.#tasks.findIndex((t) => t.id === id);

    if (index === -1) return false;

    this.#tasks.splice(index, 1);

    return true;
  };

  start = async (callback: TaskCallback) => {
    if (this.#isRunning) return;

    this.#isRunning = true;

    const temp = await mkdtemp(join(tmpdir(), "dev.akdeniz.efatura-"));
    console.log("tempdir:", temp);

    while (this.#tasks.length > 0 && !this.#stopRequested) {
      const task = await this.#preprocessTask(this.#tasks.shift()!, temp).catch(
        callback
      );

      if (!task) continue;

      console.log(task);

      await this.#runTask(task).then(callback).catch(callback);
    }

    await rm(temp, { recursive: true, force: true });

    this.#isRunning = false;
    this.#stopRequested = false;
  };

  stop = () => {
    this.#stopRequested = this.#isRunning ? true : this.#stopRequested;
  };

  #runTask = (task: TaskWithId) => {
    return new Promise<SuccessTaskResult>(
      (resolve, reject: (res: FailedTaskResult) => void) => {
        this.#workerWindow
          .loadFile(task.input)
          .then(() =>
            this.#workerWindow.webContents
              .printToPDF({ printBackground: true })
              .then((data) => writeFile(task.output, data))
              .then(() => resolve({ ...task, error: false }))
          )
          .catch((e: Error) =>
            reject({ ...task, message: e.message || "unknown", error: true })
          );
      }
    );
  };

  #taskPlain = (task: TaskWithId): Promise<TaskWithId> => Promise.resolve(task);

  #taskZippedHtml = (task: TaskWithId, temp: string): Promise<TaskWithId> =>
    new Promise((resolve, reject) => {
      const htmlFile = basename(task.input, extname(task.input)) + ".html";

      const zip = new StreamZip.async({
        file: task.input,
        storeEntries: true,
      });

      zip.on("entry", async () => {
        const entries = await zip.entries();
        if (htmlFile in entries && entries[htmlFile].isFile) {
          await zip.extract(htmlFile, temp);
          resolve({ ...task, input: join(temp, htmlFile) });
        } else {
          reject({
            ...task,
            message: "Arşiv efatura zip dosyası değil.",
            error: true,
          });
        }

        zip.close();
      });
    });

  #preprocessTask = (task: TaskWithId, temp: string): Promise<TaskWithId> => {
    if (task.input.endsWith(".zip")) {
      return this.#taskZippedHtml(task, temp);
    } else {
      return this.#taskPlain(task);
    }
  };
}

export function createWorker() {
  const worker = new PDFWorker();

  ipcMain.on("workerAdd", (e, t) => {
    e.returnValue = worker.add(t);
  });
  ipcMain.on("workerDel", (e, tId) => {
    e.returnValue = worker.delete(tId);
  });
  ipcMain.on("workerStart", (e) => {
    e.reply("workerOnStart");
    worker
      .start((t) => e.reply("workerOnTaskComplete", t))
      .finally(() => e.reply("workerOnStop"));
  });
  ipcMain.on("workerStop", () => worker.stop());
}
