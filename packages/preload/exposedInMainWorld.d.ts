interface Window {
    readonly workerAdd: (task: import("/Users/gokberk/Desktop/efatura2/packages/shared/src/worker").Task) => number;
    readonly workerDel: (taskId: number) => boolean;
    readonly workerStart: () => void;
    readonly workerOnStart: (callback: () => void) => void;
    readonly workerStop: () => void;
    readonly workerOnStop: (callback: () => void) => void;
    readonly workerOnTaskComplete: (callback: (res: import("/Users/gokberk/Desktop/efatura2/packages/shared/src/worker").TaskResult) => void) => void;
    readonly path: { join: (...paths: string[]) => string; dirname: (p: string) => string; basename: (p: string, ext?: string | undefined) => string; extname: (p: string) => string; };
    readonly fs: { isFile: (path: string) => Promise<boolean>; };
}
