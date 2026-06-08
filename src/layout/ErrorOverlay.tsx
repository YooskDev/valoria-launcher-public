import { AlertCircle } from "lucide-react";
import { useAppErrors } from "../state/error";
import { useTranslation } from "react-i18next";

export function ErrorOverlay() {
    const { t } = useTranslation();

    const errors = useAppErrors();

    if (errors.errors.length <= 0) {
        return;
    }

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                background: "#00000070",
                zIndex: 100,
            }}
            className="flex items-center justify-center"
        >
            <div className="bg-[#131a2e] rounded-lg border border-red-500/30 p-8 text-center max-w-lg">
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <AlertCircle className="w-20 h-20 text-red-500" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                    {t("modals.error.headings.first")}
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                    {t("modals.error.headings.second")}
                </p>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 overflow-y-auto custom-scrollbar max-h-[30vh]">
                    {errors.errors.map(error => (
                        <p className="text-sm text-red-300">{error}</p>
                    ))}
                </div>
                <button
                    onClick={() => errors.clear()}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-colors"
                >
                    {t("modals.error.buttons.ok")}
                </button>
            </div>
        </div>
    );
}
