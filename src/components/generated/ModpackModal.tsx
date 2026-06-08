import { X, Play, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ModpackDto } from "../../openapi";
import { useModpackRunner } from "../../lib/ipc/hooks/modpack-runner";
import { useAppState } from "../../lib/ipc/hooks/app-state";
import { useTranslation } from "react-i18next";
import { useServerStatus } from "../../lib/ipc/hooks/server-status";
import { useModpackMetadata } from "../../lib/ipc/hooks/modpack-metadata";
import { useAppConfig } from "../../state/config";

interface ModpackModalProps {
    modpack: ModpackDto;
    onClose: () => void;
}

export function ModpackModal({ modpack, onClose }: ModpackModalProps) {
    const { t } = useTranslation();
    const state = useAppState();
    const runner = useModpackRunner();

    const status = useServerStatus(modpack.serverAddress);
    const config = useAppConfig();
    const metadata = useModpackMetadata(config.gameDirectory, modpack.id);

    const handlePlay = () => {
        console.log(`Launching modpack: ${modpack.name}`);
        runner.mutate({ id: modpack.id });
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-[#0a0e1a] rounded-xl max-w-2xl w-full border border-cyan-700/30 shadow-2xl flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-cyan-700/30">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">
                                {modpack.name}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {modpack.description}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-4"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Banner Image */}
                    <div className="relative h-48 overflow-hidden">
                        <ImageWithFallback
                            src={modpack.iconUrl}
                            alt={modpack.name}
                            className="w-full h-full object-cover"
                        />
                        <div
                            className={`absolute inset-0 bg-gradient-to-t from-green-400 via-emerald-400 to-teal-400 opacity-30`}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="space-y-4">
                            {modpack.maintenance !== undefined && (
                                <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-lg p-4 mb-4">
                                    <h4 className="font-bold text-yellow-400 mb-2">
                                        {t(
                                            "modals.modpack.alerts.maintenance.name",
                                        )}
                                    </h4>
                                    <p className="text-sm text-yellow-200/80 mb-1">
                                        {modpack.maintenance.message}
                                    </p>
                                    {modpack.maintenance.endsAt
                                        !== undefined && (
                                        <p className="text-xs text-yellow-300/60 mt-2">
                                            {t(
                                                "modals.modpack.alerts.maintenance.eta",
                                                {
                                                    date: new Date(
                                                        modpack.maintenance
                                                            .endsAt,
                                                    ).toLocaleString(),
                                                },
                                            )}
                                        </p>
                                    )}
                                </div>
                            )}

                            <p className="text-gray-300 leading-relaxed">
                                {modpack.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-[#111827] border border-cyan-700/30 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-1">
                                        {t(
                                            "modals.modpack.fields.playerCount.name",
                                        )}
                                    </p>
                                    {status ?
                                        <p className="text-xl font-bold">
                                            {t(
                                                "modals.modpack.fields.playerCount.value",
                                                {
                                                    number: status.onlinePlayers,
                                                },
                                            )}
                                        </p>
                                    :   <Loader2
                                            className="animate-spin"
                                            size={24}
                                        />
                                    }{" "}
                                    {/*TODO*/}
                                </div>
                                <div className="bg-[#111827] border border-cyan-700/30 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-1">
                                        {t(
                                            "modals.modpack.fields.modCount.name",
                                        )}
                                    </p>
                                    <p className="text-xl font-bold">
                                        {t(
                                            "modals.modpack.fields.modCount.value",
                                            {
                                                number: `${metadata?.modCount ?? "?"}`,
                                            },
                                        )}
                                    </p>
                                    {/*TODO*/}
                                </div>
                            </div>
                        </div>
                    </div>

                    {modpack.canPlay && state.gameState === "stopped" && (
                        <div className="p-6 border-t border-cyan-700/30">
                            <button
                                onClick={handlePlay}
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/30"
                            >
                                <Play className="w-5 h-5 fill-white" />
                                {t("modals.modpack.buttons.play")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
