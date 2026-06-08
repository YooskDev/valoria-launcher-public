import { Loader2, Wrench } from "lucide-react";
import { ModpackCard } from "./ModpackCard";
import { useCurrentModpack } from "../../hooks/current-modpack";
import { useTranslation } from "react-i18next";

export function ModpacksGrid() {
    const { t } = useTranslation();
    const currentModpack = useCurrentModpack();

    if (currentModpack === undefined) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin" size={64} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-200">
                    {t("pages.modpacks.headings.first")}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex gap-6">
                    <ModpackCard />

                    <div className="flex-1 bg-[#111827] rounded-xl border border-cyan-700/20 p-6">
                        <h2 className="text-3xl font-bold mb-4">
                            {currentModpack.name}
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            {currentModpack.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
