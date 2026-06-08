import { useEffect, useState } from "react";
import { useAppState } from "../../../lib/ipc/hooks/app-state";
import { useTranslation } from "react-i18next";

interface LogEntry {
    id: number;
    message: string;
    timestamp: string;
}

export function LoadingScreen() {
    const { t } = useTranslation();

    const state = useAppState();
    const isOpen = state.currentTask !== null;

    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (message: string) => {
        const now = new Date();
        const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        setLogs(prev => [
            ...prev,
            { id: Date.now() + Math.random(), message, timestamp },
        ]);
    };

    useEffect(() => {
        if (!isOpen) {
            setLogs([]);
            return;
        }
    }, [isOpen]);

    useEffect(() => {
        if (state.currentTask === null) {
            return;
        }

        addLog(t(`modals.loading.status.${state.currentTask.taskType}`));
    }, [state.currentTask?.taskType]);

    if (!isOpen || state.currentTask === null) return null;

    const progress = Math.min(
        100,
        state.currentTask.max > 0 ?
            (state.currentTask.progress / state.currentTask.max) * 100
        :   0,
    );

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0e1a] rounded-xl max-w-3xl w-full border border-cyan-700/30 shadow-2xl">
                {/* Content */}
                <div className="p-6">
                    {/* Logs Section */}
                    <div className="mb-6">
                        <h3 className="text-sm text-gray-400 mb-2 font-medium">
                            {t("modals.loading.headings.logs")}
                        </h3>
                        <div className="bg-black/40 border border-cyan-700/30 rounded-lg p-4 h-64 overflow-y-auto custom-scrollbar">
                            <div className="font-mono text-sm space-y-1">
                                {logs.map(log => (
                                    <div
                                        key={log.id}
                                        className="text-green-400"
                                    >
                                        <span className="text-gray-500">
                                            [{log.timestamp}]
                                        </span>{" "}
                                        <span>{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Current Step */}
                    <div className="mb-3">
                        <p className="text-white text-sm">
                            {t(
                                `modals.loading.status.${state.currentTask.taskType}`,
                            )}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">
                                {t("modals.loading.headings.progress")}
                            </span>
                            <span className="text-cyan-400 font-bold">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="relative h-6 bg-blue-950/60 rounded-full overflow-hidden border border-cyan-500/30">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 transition-all duration-300 flex items-center justify-end pr-3"
                                style={{ width: `${progress}%` }}
                            >
                                <span className="text-white text-xs font-bold drop-shadow-lg">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
