import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { BuildSelector } from "./BuildSelector";
import { LoadingScreen } from "./loading/LoadingScreen";
import { Play, Settings, Wrench } from "lucide-react";
import { useAppState } from "../../lib/ipc/hooks/app-state";
import { useAppConfig } from "../../state/config";
import { useCurrentModpack } from "../../hooks/current-modpack";
import { useModpackRunner } from "../../lib/ipc/hooks/modpack-runner";
import { ModpackModal } from "./ModpackModal";
import { useTranslation } from "react-i18next";

export function ModpackCard() {
    const { t } = useTranslation();

    const state = useAppState();
    const config = useAppConfig();
    const currentModpack = useCurrentModpack();
    const runner = useModpackRunner();
    const [modalActive, setModalActive] = useState(false);

    const [isBuildSelectorOpen, setIsBuildSelectorOpen] = useState(false);

    const handlePlay = () => {
        if (currentModpack === undefined) {
            return;
        }

        runner.mutate({ id: currentModpack.id });
    };

    if (currentModpack === undefined) {
        return null;
    }

    return (
        <>
            <div className="modpack-card relative bg-[#131a2e] rounded-lg overflow-hidden border border-cyan-800/30 hover:border-cyan-500/50 transition-all duration-300 w-[280px]">
                <div
                    className="relative h-40 overflow-hidden cursor-pointer"
                    onClick={() => setModalActive(true)}
                >
                    <ImageWithFallback
                        src={currentModpack.iconUrl}
                        alt={currentModpack.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-transparent opacity-60" />
                </div>

                <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1.5">
                        {currentModpack.name}
                    </h3>
                    <p className="text-gray-400 text-xs mb-3 italic leading-relaxed line-clamp-2">
                        {currentModpack.description}
                    </p>

                    <button
                        onClick={handlePlay}
                        disabled={
                            state.gameState !== "stopped"
                            || !currentModpack.canPlay
                        }
                        className={`play-button w-full py-3 rounded font-bold transition-all duration-300 border-2 flex items-center justify-center gap-2 ${
                            state.gameState !== "stopped" ?
                                "bg-green-600 border-green-500 text-white cursor-wait"
                            : !currentModpack.canPlay ?
                                "bg-yellow-600 border-yellow-500 text-white"
                            :   "bg-cyan-600 hover:bg-cyan-500 border-cyan-400 text-white hover:scale-105"
                        }`}
                    >
                        {state.gameState !== "stopped" ?
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {t("pages.modpacks.status.launching")}
                            </>
                        : !currentModpack.canPlay ?
                            <>
                                <Wrench size="1em" />
                                {t("pages.modpacks.buttons.unavailable")}
                            </>
                        :   <>
                                <Play size="1em" fill="currentColor" />
                                {t("pages.modpacks.buttons.play")}
                            </>
                        }
                    </button>

                    <button
                        onClick={() => setIsBuildSelectorOpen(true)}
                        className="w-full mt-2 py-2 rounded text-sm font-medium transition-all duration-200 bg-blue-900/50 hover:bg-cyan-800/70 text-white border border-cyan-500/30 hover:border-cyan-500 flex items-center justify-center gap-2"
                    >
                        <Settings size={16} />
                        {t("pages.modpacks.buttons.select")}
                    </button>
                </div>
            </div>

            <BuildSelector
                isOpen={isBuildSelectorOpen}
                onClose={() => setIsBuildSelectorOpen(false)}
                currentBuildId={currentModpack.id}
                onSelectBuild={id => config.update({ currentModpack: id })}
            />

            <LoadingScreen />

            {modalActive && (
                <ModpackModal
                    modpack={currentModpack}
                    onClose={() => setModalActive(false)}
                />
            )}
        </>
    );
}
