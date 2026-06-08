import { useEffect, useRef, useState } from "react";
import { Upload, RotateCcw, User, Loader2 } from "lucide-react";
import { useAppAuthState, useProfile } from "../../state/auth";
import { api } from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { confirm } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { ReactSkinview3d } from "react-skinview3d";
import { useTranslation } from "react-i18next";

interface Skin2DRendererProps {
    skinUrl: string;
    slim: boolean;
    width: number;
    height: number;
}

function Skin2DRenderer({ skinUrl, slim, width, height }: Skin2DRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            ctx.clearRect(0, 0, width, height);

            const isOldFormat = img.height === 32;
            ctx.imageSmoothingEnabled = false;

            const charWidth = 16;
            const charHeight = 32;
            const scale = Math.min(width / charWidth, height / charHeight) * 0.8;

            const targetW = charWidth * scale;
            const targetH = charHeight * scale;
            const xOffset = (width - targetW) / 2;
            const yOffset = (height - targetH) / 2;

            const p = scale;

            const drawPart = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => {
                ctx.drawImage(
                    img,
                    sx, sy, sw, sh,
                    xOffset + dx * p,
                    yOffset + dy * p,
                    dw * p,
                    dh * p
                );
            };

            // Head & Overlay
            drawPart(8, 8, 8, 8, 4, 0, 8, 8);
            drawPart(40, 8, 8, 8, 4, 0, 8, 8);

            // Torso & Overlay
            drawPart(20, 20, 8, 12, 4, 8, 8, 12);
            if (!isOldFormat) {
                drawPart(20, 36, 8, 12, 4, 8, 8, 12);
            }

            // Arms:
            const armW = slim ? 3 : 4;
            const rightArmDx = 4 - armW;
            const leftArmDx = 12;

            // Right Arm & Overlay
            drawPart(44, 20, armW, 12, rightArmDx, 8, armW, 12);
            if (!isOldFormat) {
                drawPart(44, 36, armW, 12, rightArmDx, 8, armW, 12);
            }

            // Left Arm & Overlay
            if (isOldFormat) {
                drawPart(44, 20, armW, 12, leftArmDx, 8, armW, 12);
            } else {
                drawPart(36, 52, armW, 12, leftArmDx, 8, armW, 12);
                drawPart(52, 52, armW, 12, leftArmDx, 8, armW, 12);
            }

            // Legs:
            // Right Leg & Overlay
            drawPart(4, 20, 4, 12, 4, 20, 4, 12);
            if (!isOldFormat) {
                drawPart(4, 36, 4, 12, 4, 20, 4, 12);
            }

            // Left Leg & Overlay
            if (isOldFormat) {
                drawPart(4, 20, 4, 12, 8, 20, 4, 12);
            } else {
                drawPart(20, 52, 4, 12, 8, 20, 4, 12);
                drawPart(4, 52, 4, 12, 8, 20, 4, 12);
            }
        };

        img.onerror = () => {
            if (img.crossOrigin === "anonymous") {
                img.removeAttribute("crossOrigin");
                img.src = skinUrl;
            }
        };

        img.src = skinUrl;
    }, [skinUrl, slim, width, height]);

    return <canvas ref={canvasRef} width={width} height={height} className="block mx-auto" />;
}

export function SkinsGrid() {
    const { t } = useTranslation();
    const skinViewerRef = useRef<HTMLDivElement>(null);

    const auth = useAppAuthState();
    const profile = useProfile();
    const queryClient = useQueryClient();




    const [skinModel, setSkinModel] = useState<"slim" | "default">("default");
    const [use2DViewer] = useState(() => {
        const isLinux = typeof window !== "undefined" && window.navigator.userAgent.toLowerCase().includes("linux");
        if (isLinux) return true;

        try {
            const canvas = document.createElement("canvas");
            const support = !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
            return !support;
        } catch {
            return true;
        }
    });

    const handleModelChange = (model: "default" | "slim") => {
        setSkinModel(model);
        api.setSkin({ slim: model === "slim" }, undefined, {
            headers: { "X-Access-Token": auth?.accessToken },
        })
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ["profile"] });
                console.log("Model updated:", model);
            })
            .catch(() => {
                alert(t("pages.skins.errors.changeFailed"));
            });
    };

    useEffect(() => {
        if (profile === undefined) {
            return;
        }

        setSkinModel(profile.slimArms ? "slim" : "default");
    }, [profile?.slimArms]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== "image/png") {

                alert(t("pages.skins.errors.notImage"));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(",")[1]; // strip data:image/png;base64, prefix

                invoke("upload_skin", {
                    url: `${import.meta.env.VITE_SERVICES_URL}/1/profile/skin`,
                    accessToken: auth?.accessToken ?? "",
                    fileData: base64,
                    fileName: file.name,
                    slim: skinModel === "slim",
                })
                    .then(() => {
                        queryClient.invalidateQueries({ queryKey: ["profile"] });
                        console.log(
                            "Skin uploaded:",
                            file.name,
                            "Model:",
                            skinModel,
                        );
                    })
                    .catch((err) => {
                        console.error("Skin upload error:", err);
                        alert(t("pages.skins.errors.changeFailed"));
                    });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResetSkin = () => {
        confirm(t("pages.skins.alerts.confirmReset")).then(result => {
            if (!result) {
                return;
            }

            api.removeSkin(null, undefined, {
                headers: { "X-Access-Token": auth?.accessToken },
            })
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["profile"] });
                    console.log("Skin reset to default");
                })
                .catch(() => {
                    alert(t("pages.skins.errors.resetFailed"));
                });
        });
    };

    if (profile === undefined) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin" size={64} />
            </div>
        );
    }

    const displaySkin = profile?.skinUrl;
    const isDefaultSkin = displaySkin.includes("default");

    return (
        <div className="h-full flex justify-center overflow-y-auto custom-scrollbar px-1">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {t("pages.skins.headings.first")}
                    </h2>
                    <p className="text-gray-400">
                        {t("pages.skins.headings.second")}
                    </p>
                </div>

                <div className="bg-[#131a2e] rounded-lg border border-cyan-800/30 p-8 mb-6">
                    <div className="flex gap-8 items-start">
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div
                                    className="w-48 h-64 bg-[#0a0e1a] rounded-lg border-2 border-cyan-500/50 overflow-hidden"
                                    ref={skinViewerRef}
                                >
                                    {use2DViewer ? (
                                        <Skin2DRenderer
                                            skinUrl={displaySkin}
                                            slim={profile.slimArms}
                                            width={
                                                skinViewerRef.current?.clientWidth
                                                ?? 192
                                            }
                                            height={
                                                skinViewerRef.current?.clientHeight
                                                ?? 256
                                            }
                                        />
                                    ) : (
                                        <ReactSkinview3d
                                            skinUrl={displaySkin}
                                            options={{
                                                model:
                                                    profile.slimArms ? "slim" : (
                                                        "default"
                                                    ),
                                            }}
                                            width={
                                                skinViewerRef.current?.clientWidth
                                                ?? 192
                                            }
                                            height={
                                                skinViewerRef.current?.clientHeight
                                                ?? 256
                                            }
                                        />
                                    )}
                                </div>

                                <div
                                    className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold ${
                                        isDefaultSkin ?
                                            "bg-blue-600 text-white"
                                        :   "bg-green-600 text-white"
                                    }`}
                                >
                                    {isDefaultSkin ?
                                        t("pages.skins.alerts.default")
                                    :   t("pages.skins.alerts.custom")}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="bg-blue-900/20 border border-cyan-500/30 rounded-lg p-5 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <User
                                        className="text-cyan-400"
                                        size={20}
                                    />
                                    <h3 className="text-lg font-bold text-white">
                                        {t("pages.skins.headings.currentSkin")}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-sm mb-4">
                                    {isDefaultSkin ?
                                        t("pages.skins.alerts.defaultSkin")
                                    :   t("pages.skins.alerts.customSkin")}
                                </p>
 
                                <div className="bg-blue-950/40 border border-cyan-500/20 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1">
                                        <strong>
                                            {t(
                                                "pages.skins.alerts.requirements.name",
                                            )}
                                        </strong>
                                    </p>
                                    <ul className="text-xs text-gray-500 space-y-0.5">
                                        <li>
                                            •{" "}
                                            {t(
                                                "pages.skins.alerts.requirements.format",
                                                { value: "PNG" },
                                            )}
                                        </li>
                                        <li>
                                            •{" "}
                                            {t(
                                                "pages.skins.alerts.requirements.imageSize",
                                                { value: "64x64" },
                                            )}
                                        </li>
                                        <li>
                                            •{" "}
                                            {t(
                                                "pages.skins.alerts.requirements.maxFileSize",
                                                { value: 1 },
                                            )}
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-blue-900/20 border border-cyan-500/30 rounded-lg p-5 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <User
                                        className="text-cyan-400"
                                        size={18}
                                    />
                                    <h3 className="text-sm font-bold text-white">
                                        {t("pages.skins.fields.model.name")}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-xs mb-3">
                                    {t("pages.skins.fields.model.description")}
                                </p>

                                <div className="flex gap-3">
                                    <label className={`flex-1 cursor-pointer`}>
                                        <input
                                            type="radio"
                                            name="skinModel"
                                            value="default"
                                            checked={skinModel === "default"}
                                            onChange={() => handleModelChange("default")}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                                skinModel === "default" ?
                                                    "border-cyan-500 bg-cyan-600/30"
                                                :   "border-cyan-500/30 bg-blue-900/20 hover:border-cyan-500/50"
                                            }`}
                                        >
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">
                                                    🦾
                                                </div>
                                                <p className="text-white font-bold text-sm">
                                                    Default
                                                </p>
                                                <p className="text-gray-400 text-xs">
                                                    {t(
                                                        "pages.skins.fields.model.values.default",
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className={`flex-1 cursor-pointer`}>
                                        <input
                                            type="radio"
                                            name="skinModel"
                                            value="slim"
                                            checked={skinModel === "slim"}
                                            onChange={() => handleModelChange("slim")}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                                skinModel === "slim" ?
                                                    "border-cyan-500 bg-cyan-600/30"
                                                :   "border-cyan-500/30 bg-blue-900/20 hover:border-cyan-500/50"
                                            }`}
                                        >
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">
                                                    💪
                                                </div>
                                                <p className="text-white font-bold text-sm">
                                                    Slim
                                                </p>
                                                <p className="text-gray-400 text-xs">
                                                    {t(
                                                        "pages.skins.fields.model.values.slim",
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/png"
                                        onClick={event =>
                                            (event.currentTarget.value = "")
                                        }
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all duration-200 border border-cyan-500 shadow-lg shadow-blue-900/50 font-bold cursor-pointer">
                                        <Upload size={20} />
                                        <span>
                                            {t("pages.skins.buttons.upload")}
                                        </span>
                                    </div>
                                </label>

                                {!isDefaultSkin && (
                                    <button
                                        onClick={handleResetSkin}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 border border-gray-600 font-bold"
                                    >
                                        <RotateCcw size={20} />
                                        <span>
                                            {t("pages.skins.buttons.reset")}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#131a2e] rounded-lg border border-blue-500/30 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                i
                            </span>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">
                                {t("pages.skins.alerts.howTo.name")}
                            </h4>
                            <p className="text-gray-400 text-sm">
                                {t("pages.skins.alerts.howTo.message")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
