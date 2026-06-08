import { X, Check } from "lucide-react";
import { ModpackDto } from "../../openapi";
import { useModpacks } from "../../lib/api/hooks/modpacks";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useTranslation } from "react-i18next";

interface BuildSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    currentBuildId: string;
    onSelectBuild: (buildId: string) => void;
}

export function BuildSelector({
    isOpen,
    onClose,
    currentBuildId,
    onSelectBuild,
}: BuildSelectorProps) {
    const { t } = useTranslation();

    const modpacks = useModpacks();

    if (!isOpen) return null;

    const handleSelectBuild = (build: ModpackDto) => {
        onSelectBuild(build.id);
        onClose();
    };

    const currentBuild = modpacks.find(b => b.id === currentBuildId);

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-[#0a0e1a] border-2 border-cyan-500/50 rounded-lg w-[500px] shadow-2xl shadow-cyan-900/50"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
                    <h2 className="text-xl font-bold text-white">
                        {t("modals.selectModpack.headings.first")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-cyan-900/30 rounded"
                    >
                        <X size={20} />
                    </button>
                </div>

                {currentBuild && (
                    <div className="p-4 border-b border-cyan-500/30 bg-blue-900/20">
                        <div className="flex items-center gap-4">
                            {currentBuild.iconUrl && (
                                <ImageWithFallback
                                    src={currentBuild.iconUrl}
                                    alt={currentBuild.name}
                                    className="w-16 h-16 rounded-lg object-cover border border-cyan-500/50"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className="text-white font-bold mb-1">
                                    {currentBuild.name}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {currentBuild.description
                                        ?? t("modpacks.emptyDescription")}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {modpacks.map(build => {
                        const isSelected = build.id === currentBuildId;

                        return (
                            <div key={build.id}>
                                <button
                                    onClick={() => handleSelectBuild(build)}
                                    className={`w-full rounded-lg border transition-all duration-200 p-4 text-left ${
                                        isSelected ?
                                            "bg-cyan-600/30 border-cyan-500"
                                        :   "bg-blue-900/20 border-cyan-500/30 hover:bg-cyan-800/10"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white">
                                            {build.name}
                                        </h3>
                                        {isSelected && (
                                            <Check
                                                size={16}
                                                className="text-green-500"
                                            />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {build.description
                                            ?? t("modpacks.emptyDescription")}
                                    </p>
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-cyan-500/30">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                        {t("modals.selectModpack.buttons.close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
