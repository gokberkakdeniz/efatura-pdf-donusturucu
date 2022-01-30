import "./style.css";
import { createRef, html, render } from "./utils";
import type {
  FailedTaskResult,
  Task,
  TaskResult,
} from "../../shared/src/worker";

class Application {
  #fileListRef = createRef<HTMLUListElement>();
  #errorListRef = createRef<HTMLUListElement>();
  #mergeFilesInputRef = createRef<HTMLInputElement>();
  #actionsRef = createRef<HTMLDivElement>();

  constructor() {
    window.workerOnTaskComplete(this.handleTaskComplete);
    window.workerOnStart(this.handleWorkerStarted);
    window.workerOnStop(this.handleWorkerStopped);
  }

  handleDrop = (e: DragEvent) => {
    Array.from(e.dataTransfer.files).forEach(
      async (file: File & { path: string }) => {
        const { path, name, type } = file;
        const { basename, dirname, join, extname } = window.path;
        const { isFile } = window.fs;

        if (!(await isFile(path))) return;
        if (["application/pdf"].includes(type)) return;

        const output = join(
          dirname(path),
          basename(path, extname(path)) + ".pdf"
        );
        const task = { input: path, output, name: name };
        const taskId = window.workerAdd(task);

        if (taskId === -1) return;

        this.#fileListRef.current.append(this.renderFile(taskId, task));
      }
    );
  };

  handleTaskComplete = (res: TaskResult) => {
    const item = document.getElementById(`file-${res.id}`);

    if (res.error) {
      this.#errorListRef.current.append(this.renderError(res));
    }

    item?.remove();
  };

  handleWorkerStarted = () => {
    this.#errorListRef.current.replaceChildren();
    this.#actionsRef.current.classList.add("worker-running");
  };

  handleWorkerStopped = () => {
    this.#actionsRef.current.classList.remove("worker-running");
  };

  handleStart = () => {
    const shouldMerge = this.#mergeFilesInputRef.current.checked;

    if (shouldMerge) {
      console.log("shouldMerge");
    }

    window.workerStart();
  };

  handleStop = () => {
    window.workerStop();
  };

  handlePreventions = (e) => {
    e.preventDefault();
  };

  handleFileDelete = (e: PointerEvent) => {
    const el = (e.target as HTMLDivElement).parentElement as HTMLLIElement;
    this.removeFile(el);
  };

  removeFile = (el: HTMLLIElement) => {
    const taskId = Number.parseInt(el.dataset["task_id"]);
    window.workerDel(taskId);
    el.remove();
  };

  handleRemoveAll = () => {
    document.querySelectorAll(".files > li").forEach(this.removeFile);
  };

  renderFile(id: number, task: Task) {
    return html`<li id="file-${id}" data-task_id="${id}" class="file">
      <div title="${task.input}">${task.name}</div>
      <div
        class="file-delete"
        onclick="${this.handleFileDelete}"
        title="Kaldır"
      />
    </li>`;
  }

  renderError(res: FailedTaskResult) {
    const message =
      {
        ERR_FILE_NOT_FOUND: "Dosya bulunamadı.",
        EPERM: "Erişim engellendi.",
        ERR_FAILED: "Desteklenmeyen dosya tipi.",
      }[res.message?.split(" ")[0]?.replaceAll(":", "")] ?? res.message;

    return html`<li id="error-${res.id}" class="file">
      <div title="${res.input}">${res.name}</div>
      <div title="${res.message}">${message}</div>
    </li>`;
  }

  render() {
    return html`<div class="layout">
      <ul
        ondrop="${this.handleDrop}"
        ondragover="${this.handlePreventions}"
        ondragenter="${this.handlePreventions}"
        ref=${this.#fileListRef}
        class="files"
      ></ul>
      <ul class="files failures" ref=${this.#errorListRef}></ul>
      <div class="actions" ref=${this.#actionsRef}>
        <button id="removeAll" onclick="${this.handleRemoveAll}">
          Hepsini Kaldır
        </button>
        <div class="grow" />
        <div>
          <input
            type="checkbox"
            id="mergeFiles"
            checked
            ref="${this.#mergeFilesInputRef}"
          />
          <label for="mergeFiles">Dosyaları birleştir</label>
        </div>
        <button id="stop" onclick="${this.handleStop}">Durdur</button>
        <button id="start" onclick="${this.handleStart}">Başlat</button>
      </div>
    </div>`;
  }
}

render(new Application(), document.querySelector<HTMLDivElement>("#app")!);
