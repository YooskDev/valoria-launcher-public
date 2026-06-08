import { useState } from "react";
import { Mail, X, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { useAppAuthState } from "../../state/auth";

interface EmailVerificationModalProps {
    email: string;
    onClose: () => void;
    onVerify: (code: string) => void;
}

export function EmailVerificationModal({
    email,
    onClose,
    onVerify,
}: EmailVerificationModalProps) {
    const auth = useAppAuthState();

    const { t } = useTranslation();
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = () => {
        if (code.trim().length !== 6) {
            alert(t("modals.emailVerify.errors.codeInvalid"));
            return;
        }

        setIsLoading(true);

        api.confirmEmail({ code }, undefined, {
            headers: { "X-Access-Token": auth?.accessToken },
        })
            .then(() => {
                setIsLoading(false);
                onVerify(code);
            })
            .catch(() => {
                setIsLoading(false);
                alert(t("modals.emailVerify.errors.codeInvalid"));
            });
    };

    const handleResendCode = () => {
        api.setEmail(
            null,
            { email },
            { headers: { "X-Access-Token": auth?.accessToken } },
        )
            .then(() => {
                alert(t("modals.emailVerify.alerts.codeResent"));
                console.log("Code sent to:", email);
            })
            .catch(() => {
                alert(t("modals.emailVerify.errors.serverError"));
            });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[#0a0e1a] rounded-lg border-2 border-cyan-500/50 w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {t("modals.emailVerify.headings.first")}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {t("modals.emailVerify.headings.second")}
                    </p>
                    <p className="text-cyan-400 font-bold">{email}</p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">
                        {t("modals.emailVerify.fields.code.name")}
                    </label>
                    <input
                        type="text"
                        value={code}
                        onChange={e => {
                            const value = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);
                            setCode(value);
                        }}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full bg-[#131a2e] border border-cyan-500/50 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        {t("modals.emailVerify.notes.first")}
                    </p>
                </div>

                <div className="bg-blue-900/20 border border-cyan-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-2">
                        <CheckCircle
                            className="text-cyan-400 flex-shrink-0 mt-0.5"
                            size={16}
                        />
                        <p className="text-xs text-gray-400">
                            {t("modals.emailVerify.notes.second", {
                                minutes: 60 * 24,
                            })}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleVerify}
                        disabled={code.length !== 6 || isLoading}
                        className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                            code.length === 6 && !isLoading ?
                                "bg-cyan-600 hover:bg-cyan-500 text-white"
                            :   "bg-gray-700 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        {isLoading ?
                            t("modals.emailVerify.status.loading")
                        :   t("modals.emailVerify.buttons.confirm")}
                    </button>

                    <button
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-transparent border border-cyan-500/50 hover:bg-blue-900/30 text-cyan-400 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {t("modals.emailVerify.buttons.resend")}
                    </button>
                </div>
            </div>
        </div>
    );
}
