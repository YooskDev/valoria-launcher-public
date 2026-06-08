import {
    Globe,
    HardDrive,
    FolderOpen,
    AlertCircle,
    CheckCircle,
    Cpu,
} from "lucide-react";
import { useAppConfig } from "../../state/config";
import { open } from "@tauri-apps/plugin-dialog";
import { useSystemInfo } from "../../lib/ipc/hooks/system-info";
import { useTranslation } from "react-i18next";

export function SettingsSection() {
    const { t } = useTranslation();

    const systemInfo = useSystemInfo();
    const config = useAppConfig();

    const languages = [
        { code: "ru", name: "Русский", flag: "🇷🇺" },
        { code: "en", name: "English", flag: "🇺🇸" },
    ];

    const handleLanguageChange = (code: string) => {
        config.update({ locale: code });
        console.log("Language changed to:", code);
    };

    const handleRamChange = (value: number) => {
        config.update({ ram: value * 1024 });
        console.log("RAM changed to:", value, "GB");
    };

    const handleCoresChange = (value: number) => {
        config.update({ cpuCores: value });
        console.log("CPU cores changed to:", value);
    };

    const handlePathChange = () => {
        open({ directory: true, multiple: false }).then(newPath => {
            if (newPath === null) {
                return;
            }

            config.update({ gameDirectory: newPath });
            console.log("Path changed to:", newPath);
        });
    };

    const ramAmount = Math.floor(config.ram / 1024);
    const totalRam = Math.floor(systemInfo.totalMemory / 1024 / 1024 / 1024);
    const availableRam = totalRam;
    const recommendedRam = Math.floor(availableRam * 0.6);

    const isSafeRamAmount = ramAmount <= availableRam - 2;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar px-1">
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-6">
                    <div className="bg-blue-900/20 border border-cyan-500/30 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Globe className="text-cyan-400" size={20} />
                            <h3 className="text-lg font-bold text-white">
                                {t("pages.settings.sections.language.name")}
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            {t("pages.settings.sections.language.description")}
                        </p>

                        <div className="space-y-2">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() =>
                                        handleLanguageChange(lang.code)
                                    }
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 border ${
                                        config.locale === lang.code ?
                                            "bg-cyan-600/30 border-cyan-500"
                                        :   "bg-blue-900/20 border-cyan-500/30 hover:bg-cyan-800/30 hover:border-cyan-500/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-medium">
                                            {lang.name}
                                        </span>
                                    </div>
                                    {config.locale === lang.code && (
                                        <span className="text-green-500">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-6">
                    <div className="bg-blue-900/20 border border-cyan-500/30 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <HardDrive className="text-cyan-400" size={20} />
                            <h3 className="text-lg font-bold text-white">
                                {t("pages.settings.sections.memory.name")}
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            {t("pages.settings.sections.memory.description")}
                        </p>

                        <div className="bg-blue-950/40 border border-cyan-500/20 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">
                                        {t(
                                            "pages.settings.sections.memory.fields.total.name",
                                        )}
                                    </p>
                                    <p className="text-white font-bold">
                                        {totalRam} GB
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">
                                        {t(
                                            "pages.settings.sections.memory.fields.available.name",
                                        )}
                                    </p>
                                    <p className="text-green-400 font-bold">
                                        {availableRam} GB
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">
                                        {t(
                                            "pages.settings.sections.memory.fields.recommended.name",
                                        )}
                                    </p>
                                    <p className="text-cyan-400 font-bold">
                                        {recommendedRam} GB
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-white font-medium">
                                    {t(
                                        "pages.settings.sections.memory.fields.allocated.name",
                                    )}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-cyan-400 font-bold text-xl">
                                        {ramAmount} GB
                                    </span>
                                    {isSafeRamAmount ?
                                        <CheckCircle
                                            className="text-green-500"
                                            size={20}
                                        />
                                    :   <AlertCircle
                                            className="text-red-500"
                                            size={20}
                                        />
                                    }
                                </div>
                            </div>

                            <input
                                type="range"
                                min="2"
                                max={availableRam}
                                step="1"
                                value={ramAmount}
                                onChange={e =>
                                    handleRamChange(Number(e.target.value))
                                }
                                className="w-full h-2 bg-blue-900/40 rounded-lg appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none 
                         [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 
                         [&::-webkit-slider-thumb]:bg-cyan-500 
                         [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-cyan-500/50
                         [&::-moz-range-thumb]:w-4 
                         [&::-moz-range-thumb]:h-4 
                         [&::-moz-range-thumb]:bg-cyan-500 
                         [&::-moz-range-thumb]:border-0
                         [&::-moz-range-thumb]:rounded-full 
                         [&::-moz-range-thumb]:cursor-pointer"
                            />

                            <div className="flex justify-between text-xs text-gray-500">
                                <span>2 GB</span>
                                <span>{availableRam} GB</span>
                            </div>

                            {!isSafeRamAmount && (
                                <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                    <AlertCircle
                                        className="text-red-500 mt-0.5 flex-shrink-0"
                                        size={16}
                                    />
                                    <p className="text-red-400 text-xs">
                                        {t(
                                            "pages.settings.sections.memory.alerts.tooMuch",
                                        )}
                                    </p>
                                </div>
                            )}

                            {ramAmount === recommendedRam && (
                                <div className="flex items-start gap-2 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                                    <CheckCircle
                                        className="text-green-500 mt-0.5 flex-shrink-0"
                                        size={16}
                                    />
                                    <p className="text-green-400 text-xs">
                                        {t(
                                            "pages.settings.sections.memory.alerts.optimal",
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-6">
                    <div className="bg-blue-900/20 border border-cyan-500/30 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu className="text-cyan-400" size={20} />
                            <h3 className="text-lg font-bold text-white">
                                {t("pages.settings.sections.cpus.name")}
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            {t("pages.settings.sections.cpus.description")}
                        </p>

                        <div className="bg-blue-950/40 border border-cyan-500/20 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">
                                        {t(
                                            "pages.settings.sections.cpus.fields.available.name",
                                        )}
                                    </p>
                                    <p className="text-green-400 font-bold">
                                        {systemInfo.cpus}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs mb-1">
                                        {t(
                                            "pages.settings.sections.cpus.fields.allocated.name",
                                        )}
                                    </p>
                                    <p className="text-cyan-400 font-bold">
                                        {config.cpuCores}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-white font-medium">
                                    {t(
                                        "pages.settings.sections.cpus.fields.count.name",
                                    )}
                                </span>
                                <span className="text-cyan-400 font-bold text-xl">
                                    {config.cpuCores}
                                </span>
                            </div>

                            <input
                                type="range"
                                min="1"
                                max={systemInfo.cpus}
                                step="1"
                                value={config.cpuCores}
                                onChange={e =>
                                    handleCoresChange(Number(e.target.value))
                                }
                                className="w-full h-2 bg-blue-900/40 rounded-lg appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none 
                         [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 
                         [&::-webkit-slider-thumb]:bg-cyan-500 
                         [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg
                         [&::-webkit-slider-thumb]:shadow-cyan-500/50
                         [&::-moz-range-thumb]:w-4 
                         [&::-moz-range-thumb]:h-4 
                         [&::-moz-range-thumb]:bg-cyan-500 
                         [&::-moz-range-thumb]:border-0
                         [&::-moz-range-thumb]:rounded-full 
                         [&::-moz-range-thumb]:cursor-pointer"
                            />

                            <div className="flex justify-between text-xs text-gray-500">
                                <span>
                                    {t(
                                        "pages.settings.sections.cpus.fields.count.one",
                                    )}
                                </span>
                                <span>
                                    {t(
                                        "pages.settings.sections.cpus.fields.count.multiple",
                                        { number: systemInfo.cpus },
                                    )}
                                </span>
                            </div>

                            {config.cpuCores >= systemInfo.cpus - 1 && (
                                <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                                    <AlertCircle
                                        className="text-yellow-500 mt-0.5 flex-shrink-0"
                                        size={16}
                                    />
                                    <p className="text-yellow-400 text-xs">
                                        {t(
                                            "pages.settings.sections.cpus.alerts.tooMuch",
                                        )}
                                    </p>
                                </div>
                            )}

                            {config.cpuCores === 4 && (
                                <div className="flex items-start gap-2 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                                    <CheckCircle
                                        className="text-green-500 mt-0.5 flex-shrink-0"
                                        size={16}
                                    />
                                    <p className="text-green-400 text-xs">
                                        {t(
                                            "pages.settings.sections.cpus.alerts.optimal",
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-6">
                    <div className="bg-blue-900/20 border border-cyan-500/30 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FolderOpen className="text-cyan-400" size={20} />
                            <h3 className="text-lg font-bold text-white">
                                {t("pages.settings.sections.gameDir.name")}
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            {t("pages.settings.sections.gameDir.description")}
                        </p>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-blue-900/40 border border-cyan-500/30 rounded-lg p-3">
                                <span className="text-white font-mono text-sm break-all">
                                    {config.gameDirectory}
                                </span>
                            </div>
                            <button
                                onClick={handlePathChange}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg 
                         transition-all duration-200 border border-cyan-500 
                         shadow-lg shadow-cyan-900/50 font-medium"
                            >
                                {t(
                                    "pages.settings.sections.gameDir.buttons.browse",
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-gray-400 text-center">
                    {import.meta.env.APP_VERSION}
                </div>
            </div>
        </div>
    );
}
