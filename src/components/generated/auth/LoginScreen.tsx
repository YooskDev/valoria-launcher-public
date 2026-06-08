import { useState } from "react";
import { Lock, User, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "../../../lib/api";
import { AxiosError } from "axios";
import { AccessTokenFailDto } from "../../../openapi";
import { useNavigate } from "react-router";
import { useAppAuth } from "../../../state/auth";
import { useTranslation } from "react-i18next";

export function LoginScreen() {
    const { t } = useTranslation();

    const navigate = useNavigate();
    const auth = useAppAuth();

    const [step, setStep] = useState<"login" | "2fa">("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username.trim()) {
            setError(t("pages.signIn.errors.usernameMissing"));
            return;
        }
        if (!password.trim()) {
            setError(t("pages.signIn.errors.passwordMissing"));
            return;
        }
        if (password.length < 6) {
            setError(t("pages.signIn.errors.passwordShort", { minLength: 6 }));
            return;
        }

        setIsLoading(true);

        const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
        if (!isTauri) {
            setTimeout(() => {
                setIsLoading(false);
                auth.setState({
                    accessToken: "mock-access-token",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
                    autoRefresh: rememberMe,
                });
                navigate("/");
            }, 500);
            return;
        }

        api.createAccessToken(undefined, { username, password }).then(
            result => {
                setIsLoading(false);

                auth.setState({
                    accessToken: result.data.token,
                    expiresAt: result.data.expiresAt,
                    autoRefresh: rememberMe,
                });

                navigate("/");
            },
            (error: AxiosError<AccessTokenFailDto>) => {
                setIsLoading(false);
                console.error("Login API Error:", error);

                const status = error.response?.status;
                const reason = error.response?.data?.reason;

                if (status === 403 && reason === "totp_required") {
                    setStep("2fa");
                    return;
                }

                if (status === 400 || status === 401 || status === 403) {
                    setError(t("pages.signIn.errors.invalidCredentials"));
                    return;
                }

                setError(error.message || t("pages.signIn.errors.serverError"));
            },
        );
    };

    const handle2FASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!twoFactorCode.trim() || twoFactorCode.length !== 6) {
            setError(t("pages.signIn.errors.totpMissing"));
            return;
        }

        setIsLoading(true);

        const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
        if (!isTauri) {
            setTimeout(() => {
                setIsLoading(false);
                auth.setState({
                    accessToken: "mock-access-token",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
                    autoRefresh: rememberMe,
                });
                navigate("/");
            }, 500);
            return;
        }

        api.createAccessToken(null, {
            username,
            password,
            totpCode: twoFactorCode,
        }).then(
            result => {
                setIsLoading(false);

                auth.setState({
                    accessToken: result.data.token,
                    expiresAt: result.data.expiresAt,
                    autoRefresh: rememberMe,
                });

                navigate("/");
            },
            (error: AxiosError<AccessTokenFailDto>) => {
                setIsLoading(false);

                if (!error.response || !error.response.data.reason) {
                    setError(t("pages.signInTotp.errors.serverError"));
                    return;
                }

                const reason = error.response.data.reason;

                if (reason === "invalid_totp") {
                    setError(t("pages.signInTotp.errors.totpInvalid"));
                } else {
                    setError(t("pages.signInTotp.errors.serverError"));
                }
            },
        );
    };

    return (
        <div className="w-full h-screen bg-[#0a0e1a] flex items-center justify-center mx-auto">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-800/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 w-full max-w-sm px-6">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-white mb-1 tracking-wider">
                        YOOSK
                    </h1>
                    <p className="text-cyan-400 text-xs">Game Launcher</p>
                </div>

                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-6 shadow-2xl">
                    {step === "login" ?
                        <form
                            onSubmit={handleLoginSubmit}
                            className="space-y-4"
                        >
                            <div className="text-center mb-4">
                                <h2 className="text-xl font-bold text-white">
                                    {t("pages.signIn.headings.first")}
                                </h2>
                                <p className="text-gray-400 text-xs mt-1">
                                    {t("pages.signIn.headings.second")}
                                </p>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    <User className="inline mr-1.5" size={14} />
                                    {t("pages.signIn.fields.username.name")}
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder={t(
                                        "pages.signIn.fields.username.placeholder",
                                    )}
                                    className="w-full bg-[#0a0e1a] border border-cyan-500/50 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    <Lock className="inline mr-1.5" size={14} />
                                    {t("pages.signIn.fields.password.name")}
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={e =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder={t(
                                            "pages.signIn.fields.password.placeholder",
                                        )}
                                        className="w-full bg-[#0a0e1a] border border-cyan-500/50 rounded-lg px-3 py-2.5 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ?
                                            <EyeOff size={18} />
                                        :   <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={e =>
                                        setRememberMe(e.target.checked)
                                    }
                                    className="w-4 h-4 bg-[#0a0e1a] border border-cyan-500/50 rounded cursor-pointer"
                                    disabled={isLoading}
                                />
                                <label
                                    htmlFor="rememberMe"
                                    className="text-xs text-gray-300 cursor-pointer"
                                >
                                    {t("pages.signIn.fields.rememberMe.name")}
                                </label>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2.5 text-red-400 text-xs">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-bold py-2.5 rounded-lg transition-all duration-200 border-2 border-cyan-400 disabled:border-cyan-700 shadow-lg shadow-cyan-900/50 flex items-center justify-center gap-2 text-sm"
                            >
                                {isLoading ?
                                    <>
                                        <Loader2
                                            className="animate-spin"
                                            size={18}
                                        />
                                        {t("pages.signIn.status.loading")}
                                    </>
                                :   t("pages.signIn.buttons.submit")}
                            </button>
                        </form>
                    :   <form onSubmit={handle2FASubmit} className="space-y-4">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-600/20 rounded-full mb-3">
                                    <Shield
                                        className="text-cyan-400"
                                        size={28}
                                    />
                                </div>
                                <h2 className="text-xl font-bold text-white">
                                    {t("pages.signInTotp.headings.first")}
                                </h2>
                                <p className="text-gray-400 text-xs mt-2">
                                    {t("pages.signInTotp.headings.second")}
                                </p>
                            </div>

                            {/* 2FA Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5 text-center">
                                    {t("pages.signInTotp.fields.code.name")}
                                </label>
                                <input
                                    type="text"
                                    value={twoFactorCode}
                                    onChange={e => {
                                        const value = e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6);
                                        setTwoFactorCode(value);
                                    }}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full bg-[#0a0e1a] border border-cyan-500/50 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2.5 text-red-400 text-xs text-center">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={
                                    isLoading || twoFactorCode.length !== 6
                                }
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-bold py-2.5 rounded-lg transition-all duration-200 border-2 border-cyan-400 disabled:border-cyan-700 shadow-lg shadow-cyan-900/50 flex items-center justify-center gap-2 text-sm"
                            >
                                {isLoading ?
                                    <>
                                        <Loader2
                                            className="animate-spin"
                                            size={18}
                                        />
                                        {t("pages.signInTotp.status.loading")}
                                    </>
                                :   t("pages.signInTotp.buttons.submit")}
                            </button>

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setStep("login");
                                    setTwoFactorCode("");
                                    setError("");
                                }}
                                disabled={isLoading}
                                className="w-full bg-blue-900/30 hover:bg-cyan-800/50 disabled:bg-blue-900/20 text-white font-medium py-2 rounded-lg transition-all duration-200 border border-cyan-500/30 text-xs"
                            >
                                {t("pages.signInTotp.buttons.back")}
                            </button>
                        </form>
                    }
                </div>
            </div>
        </div>
    );
}
