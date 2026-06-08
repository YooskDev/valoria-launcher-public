export const TASK_TYPES = <const>[
    "downloadBundle",
    "downloadGame",
    "extractBundle",
];

export type TaskType = (typeof TASK_TYPES)[number];
