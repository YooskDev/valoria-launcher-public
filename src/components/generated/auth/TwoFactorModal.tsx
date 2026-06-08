import { useState } from "react";
import { X, Shield, Mail, Check, Copy } from "lucide-react";
import QRCode from "react-qr-code";
import base32Encode from "base32-encode";
import { api } from "../../../lib/api";
import { useAppAuth } from "../../../state/auth";
import { TOTP } from "totp-generator";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

interface TwoFactorModalProps {
    onClose: () => void;
    userEmail: string;
}

export function TwoFactorModal({ onClose }: TwoFactorModalProps) {
    const { t } = useTranslation();

    const auth = useAppAuth();
    const queryClient = useQueryClient();

    const [step, setStep] = useState<"email" | "qr" | "emailVerify" | "verify">(
        "email",
    );
    const [userEmail, setUserEmail] = useState("");
    const [emailCode, setEmailCode] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [secretKey] = useState(
        base32Encode(crypto.getRandomValues(new Uint8Array(10)), "RFC3548"),
    );

    const otpAuthUrl = `otpauth://totp/YOOSK:${userEmail}?secret=${secretKey}&issuer=YOOSK`;

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secretKey);
        alert(t("modals.twoFactor.steps.qrCode.alerts.secretCopied"));
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const trimmedEmail = userEmail.trim();
        if (!trimmedEmail) {
            setError(t("modals.twoFactor.steps.email.errors.emailMissing"));
            return;
        }
        if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
            setError(t("modals.twoFactor.steps.email.errors.emailInvalid"));
            return;
        }

        console.log(`✅ Email ${trimmedEmail} accepted`);
        setStep("qr");
    };

    const handleSendEmailCode = () => {
        setIsLoading(true);
        setError("");

        api.setEmail(
            null,
            { email: userEmail },
            { headers: { "X-Access-Token": auth.state?.accessToken } },
        )
            .then(() => {
                setIsLoading(false);
                console.log(`📧 Confirmation code sent to ${userEmail}`);
                alert(
                    t(
                        "modals.twoFactor.steps.emailVerify.alerts.emailCodeSent",
                        { email: userEmail },
                    ),
                );
                setStep("emailVerify");
            })
            .catch(() => {
                setIsLoading(false);
                alert(
                    t("modals.twoFactor.steps.emailVerify.errors.emailInvalid"),
                );
            });
    };

    const handleVerifyEmailCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (emailCode.length !== 6) {
            setError(
                t("modals.twoFactor.steps.emailVerify.errors.emailCodeMissing"),
            );
            return;
        }

        setIsLoading(true);

        api.confirmEmail({ code: emailCode }, undefined, {
            headers: { "X-Access-Token": auth.state?.accessToken },
        })
            .then(() => {
                setIsLoading(false);
                console.log("✅ Email confirmed");
                queryClient.invalidateQueries({ queryKey: ["profile"] });
                setStep("verify");
            })
            .catch(() => {
                setIsLoading(false);
                alert(
                    t(
                        "modals.twoFactor.steps.emailVerify.errors.emailCodeInvalid",
                    ),
                );
            });
    };

    const handleVerify2FACode = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (verifyCode.length !== 6) {
            setError(
                t("modals.twoFactor.steps.totpVerify.errors.totpCodeMissing"),
            );
            return;
        }

        setIsLoading(true);

        TOTP.generate(secretKey).then(result => {
            if (verifyCode !== result.otp) {
                alert(
                    t(
                        "modals.twoFactor.steps.totpVerify.errors.totpCodeInvalid",
                    ),
                );
                setIsLoading(false);
                return;
            }

            api.setTotpSecret(
                null,
                { secret: secretKey },
                { headers: { "X-Access-Token": auth.state?.accessToken } },
            )
                .then(() => {
                    setIsLoading(false);
                    console.log("✅ 2FA set up successfully!");
                    queryClient.invalidateQueries({ queryKey: ["profile"] });
                    onClose();
                })
                .catch(() => {
                    setIsLoading(false);
                    alert(
                        t(
                            "modals.twoFactor.steps.totpVerify.errors.serverError",
                        ),
                    );
                });
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#131a2e] rounded-lg border border-cyan-800/50 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-cyan-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                            <Shield className="text-cyan-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {t("modals.twoFactor.headings.first")}
                            </h2>
                            <p className="text-xs text-gray-400">
                                {t("modals.twoFactor.headings.second")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="px-5 pt-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    step === "email" ?
                                        "bg-cyan-600 text-white"
                                    : (
                                        step === "qr"
                                        || step === "emailVerify"
                                        || step === "verify"
                                    ) ?
                                        "bg-green-600 text-white"
                                    :   "bg-blue-900/30 text-gray-500"
                                }`}
                            >
                                {step === "emailVerify" || step === "verify" ?
                                    <Check size={16} />
                                :   "1"}
                            </div>
                            <span className="text-xs text-gray-400">
                                {t("modals.twoFactor.steps.email.name")}
                            </span>
                        </div>
                        <div className="flex-1 h-0.5 bg-blue-900/30 mx-2">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    (
                                        step === "emailVerify"
                                        || step === "verify"
                                    ) ?
                                        "bg-cyan-600 w-full"
                                    :   "w-0"
                                }`}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    step === "qr" ? "bg-cyan-600 text-white"
                                    : (
                                        step === "emailVerify"
                                        || step === "verify"
                                    ) ?
                                        "bg-green-600 text-white"
                                    :   "bg-blue-900/30 text-gray-500"
                                }`}
                            >
                                {step === "emailVerify" || step === "verify" ?
                                    <Check size={16} />
                                :   "2"}
                            </div>
                            <span className="text-xs text-gray-400">
                                {t("modals.twoFactor.steps.qrCode.name")}
                            </span>
                        </div>
                        <div className="flex-1 h-0.5 bg-blue-900/30 mx-2">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    (
                                        step === "emailVerify"
                                        || step === "verify"
                                    ) ?
                                        "bg-cyan-600 w-full"
                                    :   "w-0"
                                }`}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    (
                                        step === "emailVerify"
                                        || step === "verify"
                                    ) ?
                                        "bg-cyan-600 text-white"
                                    :   "bg-blue-900/30 text-gray-500"
                                }`}
                            >
                                3
                            </div>
                            <span className="text-xs text-gray-400">
                                {t("modals.twoFactor.steps.verification.name")}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    {step === "email" && (
                        <form
                            onSubmit={handleEmailSubmit}
                            className="space-y-4"
                        >
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-600/20 rounded-full mb-3">
                                    <Mail
                                        className="text-cyan-400"
                                        size={28}
                                    />
                                </div>
                                <p className="text-sm text-gray-300">
                                    {t(
                                        "modals.twoFactor.steps.email.headings.first",
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                                    {t(
                                        "modals.twoFactor.steps.email.fields.email.name",
                                    )}
                                </label>
                                <input
                                    type="email"
                                    value={userEmail}
                                    onChange={e => setUserEmail(e.target.value)}
                                    placeholder="example@example.com"
                                    className="w-full bg-[#0a0e1a] border border-cyan-500/50 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2.5 text-red-400 text-xs text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !userEmail}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-blue-800 text-white font-bold py-2.5 rounded-lg transition-all duration-200 border-2 border-cyan-400 disabled:border-blue-700 shadow-lg text-sm"
                            >
                                {isLoading ?
                                    t(
                                        "modals.twoFactor.steps.email.status.loading",
                                    )
                                :   t(
                                        "modals.twoFactor.steps.email.buttons.next",
                                    )
                                }
                            </button>
                        </form>
                    )}

                    {step === "qr" && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-300 mb-4">
                                    {t(
                                        "modals.twoFactor.steps.qrCode.headings.first",
                                    )}
                                </p>

                                <div className="inline-block p-4 bg-white rounded-lg mb-4">
                                    <QRCode value={otpAuthUrl} size={200} />
                                </div>

                                <div className="bg-[#0a0e1a] border border-cyan-500/30 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-gray-400 mb-2">
                                        {t(
                                            "modals.twoFactor.steps.qrCode.fields.secretKey.name",
                                        )}
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                        <code className="text-cyan-400 font-mono text-sm flex-1 break-all">
                                            {secretKey}
                                        </code>
                                        <button
                                            onClick={handleCopySecret}
                                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSendEmailCode}
                                disabled={isLoading}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-blue-800 text-white font-bold py-2.5 rounded-lg transition-all duration-200 border-2 border-cyan-400 disabled:border-blue-700 shadow-lg text-sm"
                            >
                                {isLoading ?
                                    t(
                                        "modals.twoFactor.steps.qrCode.status.loading",
                                    )
                                :   t(
                                        "modals.twoFactor.steps.qrCode.buttons.next",
                                    )
                                }
                            </button>
                        </div>
                    )}

                    {step === "emailVerify" && (
                        <form
                            onSubmit={handleVerifyEmailCode}
                            className="space-y-4"
                        >
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-600/20 rounded-full mb-3">
                                    <Mail
                                        className="text-cyan-400"
                                        size={28}
                                    />
                                </div>
                                <p className="text-sm text-gray-300">
                                    {t(
                                        "modals.twoFactor.steps.emailVerify.headings.first",
                                    )}
                                </p>
                                <p className="text-cyan-400 font-medium text-sm mt-1">
                                    {userEmail}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                                    {t(
                                        "modals.twoFactor.steps.emailVerify.fields.code.name",
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={emailCode}
                                    onChange={e => {
                                        const value = e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6);
                                        setEmailCode(value);
                                    }}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full bg-[#0a0e1a] border border-cyan-500/50 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2.5 text-red-400 text-xs text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || emailCode.length !== 6}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-blue-800 text-white font-bold py-2.5 rounded-lg transition-all duration-200 border-2 border-cyan-400 disabled:border-blue-700 shadow-lg text-sm"
                            >
                                {isLoading ?
                                    t(
                                        "modals.twoFactor.steps.emailVerify.status.loading",
                                    )
                                :   t(
                                        "modals.twoFactor.steps.emailVerify.buttons.next",
                                    )
                                }
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("qr");
                                    setEmailCode("");
                                    setError("");
                                }}
                                disabled={isLoading}
                                className="w-full bg-blue-900/30 hover:bg-cyan-800/50 text-white font-medium py-2 rounded-lg transition-all duration-200 border border-cyan-500/30 text-xs"
                            >
                                {t(
                                    "modals.twoFactor.steps.emailVerify.buttons.back",
                                )}
                            </button>
                        </form>
                    )}

                    {step === "verify" && (
                        <form
                            onSubmit={handleVerify2FACode}
                            className="space-y-4"
                        >
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600/20 rounded-full mb-3">
                                    <Check
                                        className="text-green-400"
                                        size={28}
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    {t(
                                        "modals.twoFactor.steps.totpVerify.headings.first",
                                    )}
                                </h3>
                                <p className="text-sm text-gray-300">
                                    {t(
                                        "modals.twoFactor.steps.totpVerify.headings.second",
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                                    {t(
                                        "modals.twoFactor.steps.totpVerify.fields.code.name",
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={verifyCode}
                                    onChange={e => {
                                        const value = e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6);
                                        setVerifyCode(value);
                                    }}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full bg-[#0a0e1a] border border-cyan-500/50 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2.5 text-red-400 text-xs text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || verifyCode.length !== 6}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white font-bold py-2.5 rounded-lg transition-all duration-200 border-2 border-green-400 disabled:border-green-700 shadow-lg text-sm"
                            >
                                {isLoading ?
                                    t(
                                        "modals.twoFactor.steps.totpVerify.status.loading",
                                    )
                                :   t(
                                        "modals.twoFactor.steps.totpVerify.buttons.next",
                                    )
                                }
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("emailVerify");
                                    setVerifyCode("");
                                    setError("");
                                }}
                                disabled={isLoading}
                                className="w-full bg-blue-900/30 hover:bg-cyan-800/50 text-white font-medium py-2 rounded-lg transition-all duration-200 border border-cyan-500/30 text-xs"
                            >
                                {t(
                                    "modals.twoFactor.steps.totpVerify.buttons.back",
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
