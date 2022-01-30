export type Task = {
  input: string;
  output: string;
  name: string;
};

export type TaskWithId = Task & { id: number };

export type SuccessTaskResult = TaskWithId & { error: false };

export type FailedTaskResult = TaskWithId & { error: true; message: string };

export type TaskResult = SuccessTaskResult | FailedTaskResult;

export type TaskCallback = (t: TaskResult) => void;
