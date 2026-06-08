import { useMutation, useQuery } from "@tanstack/react-query";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ReactNode, useEffect, useState } from "react";
import { useErrorCapture } from "../hooks/error-capture";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UpdateBoundaryProps {
    children: ReactNode;
}

export function UpdateBoundary(props: UpdateBoundaryProps) {
    const { t } = useTranslation();
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    if (!isTauri) {
        return props.children;
    }

    const [contentLength, setContentLength] = useState(0);
    const [downloaded, setDownloaded] = useState(0);

    const updateCheck = useQuery({
        queryKey: ["update-check"],
        queryFn: () => check({ timeout: 5000 }),
        staleTime: 1000 * 60 * 60,
        enabled: isTauri,
    });

    useErrorCapture("Failed to check for updates", updateCheck.error);

    const updateMutation = useMutation({
        mutationKey: ["update"],

        mutationFn: (update: Update) =>
            update.downloadAndInstall(event => {
                switch (event.event) {
                    case "Started":
                        setContentLength(
                            event.data.contentLength ?? 1024 * 1024 * 50,
                        );
                        break;

                    case "Progress":
                        setDownloaded(
                            downloaded => downloaded + event.data.chunkLength,
                        );
                        setContentLength(length =>
                            Math.max(
                                length,
                                downloaded + event.data.chunkLength,
                            ),
                        );
                        break;

                    case "Finished":
                        setDownloaded(contentLength);
                        break;
                }
            }, { timeout: 30000 }),

        async onSuccess() {
            console.log("relaunch");
            await relaunch();
        },
    });

    useErrorCapture(
        "Failed to download and install update",
        updateMutation.error,
    );

    useEffect(() => {
        if (updateCheck.data == null || updateMutation.isPending) {
            return;
        }

        updateMutation.mutate(updateCheck.data);
    }, [updateCheck.data]);

    if (updateCheck.isLoading) {
        return (
            <div className="w-full h-screen flex gap-8 items-center justify-center text-white">
                <h1 className="text-xl">{t("pages.update.status.checking")}</h1>

                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (updateMutation.isPending || updateMutation.isError) {
        const progress =
            contentLength > 0 ? (downloaded / contentLength) * 100 : 0;

        return (
            <div className="w-full h-screen flex flex-col justify-center p-64">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                            {t("pages.update.status.downloading")}
                        </span>
                        <span className="text-cyan-400 font-bold">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="relative h-6 bg-blue-950/60 rounded-full overflow-hidden border border-cyan-500/30">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 flex items-center justify-end pr-3"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }

    return props.children;
}
