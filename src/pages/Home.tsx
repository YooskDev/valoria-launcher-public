import { useProfile } from "../state/auth";
import { ModpacksGrid } from "../components/generated/ModpacksGrid";
import { AlertTriangle, Ban, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Home() {
    const { t } = useTranslation();

    const profile = useProfile();

    if (profile === undefined) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin" size={64} />
            </div>
        );
    }

    if (profile.ban !== undefined) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="max-w-lg text-center">
                    <div className="bg-[#2a1a4a] rounded-lg border border-red-500/30 p-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <Ban className="w-20 h-20 text-red-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {t("pages.modpacks.alerts.banned.name")}
                        </h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            {t("pages.modpacks.alerts.banned.message")}
                        </p>
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-300">
                                {profile.ban.reason}
                            </p>
                        </div>
                        {profile.ban.expiresAt ?
                            <p className="text-gray-500 leading-relaxed">
                                {t("pages.modpacks.alerts.banned.until", {
                                    date: new Date(
                                        profile.ban.expiresAt,
                                    ).toLocaleString(),
                                })}
                            </p>
                        :   <p className="text-gray-500 leading-relaxed font-bold">
                                {t("pages.modpacks.alerts.banned.permanent")}
                            </p>
                        }
                    </div>
                </div>
            </div>
        );
    }

    if (profile.forcedTotp && !profile.hasTotp) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="max-w-lg text-center">
                    <div className="bg-[#2a1a4a] rounded-lg border border-yellow-500/30 p-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <AlertTriangle className="w-20 h-20 text-yellow-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {t("pages.modpacks.alerts.forcedTotp.name")}
                        </h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            {t("pages.modpacks.alerts.forcedTotp.message")}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <ModpacksGrid />;
}
