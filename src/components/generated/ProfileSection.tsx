import { useState } from "react";
import { Lock, LogOut, Loader2 } from "lucide-react";
import { useAppAuth, useAppAuthState, useProfile } from "../../state/auth";
import { api } from "../../lib/api";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { McAvatar } from "../McAvatar";
export function ProfileSection() {
    const { t } = useTranslation();

    const profile = useProfile();
    const authState = useAppAuthState();
    const auth = useAppAuth();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isEditingPassword, setIsEditingPassword] = useState(false);

    if (profile === undefined) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin" size={64} />
            </div>
        );
    }

    const handleSavePassword = () => {
        const trimmedNew = newPassword;
        const trimmedConfirm = confirmPassword;

        if (!trimmedNew || !trimmedConfirm) {
            alert(t("pages.profile.errors.passwordMissing"));
            return;
        }
        if (trimmedNew.length < 6) {
            alert(t("pages.profile.errors.passwordShort", { minLength: 6 }));
            return;
        }
        if (trimmedNew !== trimmedConfirm) {
            alert(t("pages.profile.errors.passwordMismatch"));
            return;
        }

        api.setPassword(
            null,
            { password: newPassword },
            { headers: { "X-Access-Token": authState?.accessToken } },
        )
            .then(() => {
                alert(t("pages.profile.alerts.passwordChanged"));
                setNewPassword("");
                setConfirmPassword("");
                setIsEditingPassword(false);
            })
            .catch(() => {
                alert(t("pages.profile.errors.serverError"));
            });
    };

    const handleLogout = () => {
        confirm(t("pages.profile.alerts.logout")).then(result => {
            if (!result) {
                return;
            }

            console.log("Account log out");
            auth.logout();
            alert(t("pages.profile.alerts.logoutSuccess"));
        });
    };

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar px-1">
            <div className="max-w-2xl mx-auto">
                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-6 mb-4">
                    <h2 className="text-2xl font-bold text-white mb-6">
                        {t("pages.profile.headings.first")}
                    </h2>
 
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-cyan-500/30">
                        <div className="relative">
                            <McAvatar
                                skinUrl={profile.skinUrl}
                                className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500"
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">
                                {profile.username}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                {profile?.roles.map(role => (
                                    <span key={role} className="text-sm text-gray-400">
                                        {role}
                                    </span>
                                ))}
 
                                {profile?.roles.includes("dev") && (
                                    <span className="px-2 py-0.5 bg-cyan-600 rounded text-xs font-bold">
                                        DEV
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-900/20 border border-cyan-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="text-cyan-400" size={18} />
                                <h3 className="text-sm font-bold text-gray-400">
                                    {t("pages.profile.fields.password.name")}
                                </h3>
                            </div>
                            {isEditingPassword ?
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            {t(
                                                "pages.profile.fields.newPassword.name",
                                            )}
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e =>
                                                setNewPassword(e.target.value)
                                            }
                                            placeholder={t(
                                                "pages.profile.fields.newPassword.placeholder",
                                            )}
                                            className="w-full bg-[#0a0e1a] border border-cyan-500/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            {t(
                                                "pages.profile.fields.confirmPassword.name",
                                            )}
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e =>
                                                setConfirmPassword(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                "pages.profile.fields.confirmPassword.placeholder",
                                            )}
                                            className="w-full bg-[#0a0e1a] border border-cyan-500/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSavePassword}
                                            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-bold transition-colors"
                                        >
                                            {t("pages.profile.buttons.save")}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setNewPassword("");
                                                setConfirmPassword("");
                                                setIsEditingPassword(false);
                                            }}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-bold transition-colors"
                                        >
                                            {t("pages.profile.buttons.cancel")}
                                        </button>
                                    </div>
                                </div>
                            :   <div className="flex items-center justify-between">
                                    <span className="text-white">
                                        ••••••••••
                                    </span>
                                    <button
                                        onClick={() =>
                                            setIsEditingPassword(true)
                                        }
                                        className="px-3 py-1 bg-blue-900/50 hover:bg-cyan-800/70 text-white rounded text-xs transition-colors"
                                    >
                                        {t("pages.profile.buttons.edit")}
                                    </button>
                                </div>
                            }
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors"
                        >
                            <LogOut size={18} />
                            {t("pages.profile.buttons.logOut")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
