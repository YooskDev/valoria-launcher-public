import { TaskType } from "./task-type";

export interface CurrentTask {
    taskType: TaskType;
    progress: number;
    max: number;
}
