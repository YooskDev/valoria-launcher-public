import { useState } from "react";
import { Search, Puzzle, Check, AlertTriangle, Package } from "lucide-react";
import { useOptionalFiles } from "../../state/optional-files";
import { useModpackMetadata } from "../../lib/ipc/hooks/modpack-metadata";
import { useAppConfig } from "../../state/config";
import { useTranslation } from "react-i18next";
import { useCurrentModpack } from "../../hooks/current-modpack";

export function ModsSection() {
    const { t } = useTranslation();

    const CATEGORIES = [
        { id: "all", color: "cyan" },
        { id: "optimization", color: "green" },
        { id: "gameplay", color: "blue" },
        { id: "visual", color: "pink" },
        { id: "utility", color: "yellow" },
        { id: "debug", color: "red" },
    ] as const;

    const config = useAppConfig();
    const currentModpack = useCurrentModpack();
    const currentModpackId = currentModpack?.id ?? "";
    const metadata = useModpackMetadata(
        config.gameDirectory,
        currentModpackId,
    );
    const optionalFiles = useOptionalFiles();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const hasModpack = metadata !== undefined;

    const mods = metadata?.optionalFiles ?? [];

    const toggleMod = (modId: string) => {
        if (metadata === undefined) {
            return;
        }

        const value = optionalFiles.getValue(
            metadata.optionalFiles,
            currentModpackId,
            modId,
        );

        optionalFiles.update(currentModpackId, modId, !value);
    };

    const filteredMods = mods.filter(mod => {
        const matchesSearch =
            mod.name.toLowerCase().includes(searchQuery.toLowerCase())
            || mod.description
                ?.toLowerCase()
                ?.includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === "all" || mod.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const enabledCount = mods.filter(m =>
        optionalFiles.getValue(mods, currentModpackId, m.path),
    ).length;

    if (!hasModpack) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="max-w-lg text-center">
                    <div className="bg-[#131a2e] rounded-lg border border-yellow-500/30 p-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <Package className="w-20 h-20 text-yellow-500" />
                                <AlertTriangle className="w-8 h-8 text-yellow-400 absolute -bottom-1 -right-1" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {t("pages.mods.alerts.notInstalled.name")}
                        </h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            {t("pages.mods.alerts.notInstalled.message")}
                        </p>
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                            <p className="text-sm text-yellow-300">
                                {t("pages.mods.alerts.notInstalled.note")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Puzzle className="w-6 h-6 text-cyan-400" />
                    <div>
                        <h1 className="text-2xl font-bold">
                            {t("pages.mods.headings.first")}
                        </h1>
                        <p className="text-sm text-gray-400">
                            {t("pages.mods.headings.second", {
                                number: enabledCount,
                                max: mods.length,
                            })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={t("pages.mods.fields.search.placeholder")}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#111827] border border-cyan-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <div className="bg-cyan-600 bg-green-600 bg-blue-600 bg-pink-600 bg-yellow-600 bg-red-600" />
                {/* ^^^ hack */}

                {CATEGORIES.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                            selectedCategory === category.id ?
                                `bg-${category.color}-600 text-white`
                            :   "bg-blue-900/30 text-gray-400 hover:bg-cyan-800/50 hover:text-white"
                        }`}
                    >
                        {t(`pages.mods.categories.${category.id}`)}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {filteredMods.length === 0 ?
                    <div className="text-center py-12">
                        <Puzzle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">
                            {t("pages.mods.alerts.noneFound.name")}
                        </p>
                        <p className="text-gray-500 text-sm">
                            {t("pages.mods.alerts.noneFound.message")}
                        </p>
                    </div>
                :   filteredMods.map(mod => (
                        <div
                            key={mod.path}
                            className={`bg-[#111827] border rounded-lg p-4 transition-all duration-200 ${
                                (
                                    optionalFiles.getValue(
                                        mods,
                                        currentModpackId,
                                        mod.path,
                                    )
                                ) ?
                                    "border-green-500/50 shadow-lg shadow-green-900/20"
                                :   "border-cyan-700/20 hover:border-cyan-500/40"
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Toggle switch */}
                                <button
                                    onClick={() => toggleMod(mod.path)}
                                    className={`mt-1 relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                        (
                                            optionalFiles.getValue(
                                                mods,
                                                currentModpackId,
                                                mod.path,
                                            )
                                        ) ?
                                            "bg-green-600"
                                        :   "bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                            (
                                                optionalFiles.getValue(
                                                    mods,
                                                    currentModpackId,
                                                    mod.path,
                                                )
                                            ) ?
                                                "translate-x-5"
                                            :   "translate-x-0.5"
                                        }`}
                                    />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white text-lg">
                                                    {mod.name}
                                                </h3>
                                                {optionalFiles.getValue(
                                                    mods,
                                                    currentModpackId,
                                                    mod.path,
                                                ) && (
                                                    <Check
                                                        size={16}
                                                        className="text-green-500 flex-shrink-0"
                                                    />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                {mod.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <span className="text-gray-400">
                                                {t(
                                                    "pages.mods.fields.version.name",
                                                )}
                                            </span>
                                            <span className="text-cyan-300">
                                                {mod.version}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="text-gray-400">
                                                {t(
                                                    "pages.mods.fields.author.name",
                                                )}
                                            </span>
                                            <span className="text-cyan-300">
                                                {mod.author}
                                            </span>
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded ${
                                                (
                                                    mod.category
                                                    === "optimization"
                                                ) ?
                                                    "bg-green-600/30 text-green-300"
                                                : mod.category === "gameplay" ?
                                                    "bg-blue-600/30 text-blue-300"
                                                : mod.category === "visual" ?
                                                    "bg-pink-600/30 text-pink-300"
                                                : mod.category === "utility" ?
                                                    "bg-yellow-600/30 text-yellow-300"
                                                :   "bg-red-600/30 text-red-300"
                                            }`}
                                        >
                                            {t(
                                                `pages.mods.categories.${mod.category}`,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}
