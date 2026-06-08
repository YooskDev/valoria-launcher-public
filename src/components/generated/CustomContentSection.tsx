import { useEffect, useState } from "react";
import { FolderOpen, Upload, Trash2, Eye, Paintbrush, Loader2, Info } from "lucide-react";
import { useAppConfig } from "../../state/config";
import { useCurrentModpack } from "../../hooks/current-modpack";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export function CustomContentSection() {
    const config = useAppConfig();
    const currentModpack = useCurrentModpack();
    const currentModpackId = currentModpack?.id ?? "";

    const [resourcePacks, setResourcePacks] = useState<string[]>([]);
    const [shaders, setShaders] = useState<string[]>([]);
    const [loadingResourcePacks, setLoadingResourcePacks] = useState(false);
    const [loadingShaders, setLoadingShaders] = useState(false);

    const refreshResourcePacks = async () => {
        if (!currentModpackId) return;
        setLoadingResourcePacks(true);
        try {
            const files = await invoke<string[]>("list_custom_assets", {
                gameDir: config.gameDirectory,
                modpackId: currentModpackId,
                assetType: "resourcepacks",
            });
            setResourcePacks(files);
        } catch (e) {
            console.error("Failed to list resource packs", e);
        } finally {
            setLoadingResourcePacks(false);
        }
    };

    const refreshShaders = async () => {
        if (!currentModpackId) return;
        setLoadingShaders(true);
        try {
            const files = await invoke<string[]>("list_custom_assets", {
                gameDir: config.gameDirectory,
                modpackId: currentModpackId,
                assetType: "shaderpacks",
            });
            setShaders(files);
        } catch (e) {
            console.error("Failed to list shader packs", e);
        } finally {
            setLoadingShaders(false);
        }
    };

    useEffect(() => {
        if (currentModpackId) {
            refreshResourcePacks();
            refreshShaders();
        }
    }, [currentModpackId, config.gameDirectory]);

    const handleImport = async (type: "resourcepack" | "shaderpack") => {
        if (!currentModpackId) return;
        try {
            const selected = await open({
                multiple: false,
                filters: [
                    {
                        name: type === "resourcepack" ? "Resource Pack (.zip)" : "Shader Pack (.zip)",
                        extensions: ["zip"],
                    },
                ],
            });

            if (selected && typeof selected === "string") {
                await invoke("import_player_asset", {
                    gameDir: config.gameDirectory,
                    modpackId: currentModpackId,
                    assetType: type,
                    srcFilePath: selected,
                });
                if (type === "resourcepack") {
                    refreshResourcePacks();
                } else {
                    refreshShaders();
                }
            }
        } catch (e) {
            alert(`Ошибка импорта: ${e}`);
        }
    };

    const handleDelete = async (type: "resourcepack" | "shaderpack", filename: string) => {
        if (!currentModpackId) return;
        const confirmDelete = window.confirm(`Вы действительно хотите удалить ${filename}?`);
        if (!confirmDelete) return;

        try {
            await invoke("delete_player_asset", {
                gameDir: config.gameDirectory,
                modpackId: currentModpackId,
                assetType: type,
                filename,
            });
            if (type === "resourcepack") {
                refreshResourcePacks();
            } else {
                refreshShaders();
            }
        } catch (e) {
            alert(`Ошибка удаления: ${e}`);
        }
    };

    const handleOpenFolder = async (folderName: "resourcepacks" | "shaderpacks") => {
        if (!currentModpackId) return;
        try {
            await invoke("open_instance_folder", {
                gameDir: config.gameDirectory,
                modpackId: currentModpackId,
                subFolder: folderName,
            });
        } catch (e) {
            alert(`Не удалось открыть папку: ${e}`);
        }
    };

    if (!currentModpackId) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center p-8 bg-[#131a2e] rounded-lg border border-cyan-800/30 max-w-md">
                    <Info className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Модпак не выбран</h2>
                    <p className="text-gray-400 text-sm">
                        Пожалуйста, вернитесь на главную страницу и выберите сборку, чтобы управлять её ресурсами.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-y-auto custom-scrollbar px-1">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Пользовательский контент</h1>
                <p className="text-sm text-gray-400">
                    Управляйте своими ресурс-паками и шейдерами для сборки <span className="text-cyan-400 font-semibold">{currentModpack?.name}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                {/* Resource Packs Column */}
                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-6 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-4 border-b border-cyan-800/30 pb-3">
                        <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-bold text-white">Ресурс-паки (Текстуры)</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleOpenFolder("resourcepacks")}
                                className="p-2 rounded-lg bg-blue-900/30 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-800/30 transition-all"
                                title="Открыть папку"
                            >
                                <FolderOpen size={16} />
                            </button>
                            <button
                                onClick={() => handleImport("resourcepack")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
                            >
                                <Upload size={14} />
                                <span>Импорт</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {loadingResourcePacks ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-cyan-500" size={24} />
                            </div>
                        ) : resourcePacks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <Eye className="w-10 h-10 text-gray-600 mb-2" />
                                <p className="text-xs text-gray-500">Нет установленных ресурс-паков.</p>
                                <p className="text-[10px] text-gray-600 mt-1 max-w-[200px]">
                                    Импортируйте .zip архив или перетащите его в папку ресурс-паков.
                                </p>
                            </div>
                        ) : (
                            resourcePacks.map((pack) => (
                                <div key={pack} className="flex items-center justify-between p-3 bg-[#0a0e1a] rounded-lg border border-cyan-900/30 hover:border-cyan-500/30 transition-all">
                                    <span className="text-xs text-gray-300 font-medium truncate flex-1 pr-4">{pack}</span>
                                    <button
                                        onClick={() => handleDelete("resourcepack", pack)}
                                        className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Shader Packs Column */}
                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-6 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-4 border-b border-cyan-800/30 pb-3">
                        <div className="flex items-center gap-2">
                            <Paintbrush className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-bold text-white">Шейдеры</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleOpenFolder("shaderpacks")}
                                className="p-2 rounded-lg bg-blue-900/30 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-800/30 transition-all"
                                title="Открыть папку"
                            >
                                <FolderOpen size={16} />
                            </button>
                            <button
                                onClick={() => handleImport("shaderpack")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
                            >
                                <Upload size={14} />
                                <span>Импорт</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {loadingShaders ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-cyan-500" size={24} />
                            </div>
                        ) : shaders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <Paintbrush className="w-10 h-10 text-gray-600 mb-2" />
                                <p className="text-xs text-gray-500">Нет установленных шейдеров.</p>
                                <p className="text-[10px] text-gray-600 mt-1 max-w-[200px]">
                                    Импортируйте .zip архив или распакуйте его в папку шейдер-паков.
                                </p>
                            </div>
                        ) : (
                            shaders.map((shader) => (
                                <div key={shader} className="flex items-center justify-between p-3 bg-[#0a0e1a] rounded-lg border border-cyan-900/30 hover:border-cyan-500/30 transition-all">
                                    <span className="text-xs text-gray-300 font-medium truncate flex-1 pr-4">{shader}</span>
                                    <button
                                        onClick={() => handleDelete("shaderpack", shader)}
                                        className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
