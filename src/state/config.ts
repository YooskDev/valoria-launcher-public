import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appDataDir } from "@tauri-apps/api/path";

export interface AppConfig {
    gameDirectory: string;
    currentModpack: string;
    ram: number;
    cpuCores: number;
    locale: string;
    devMode: boolean;

    update(value: Partial<AppConfig>): void;
}

export const useAppConfig = create<AppConfig>()(
    persist(
        set => ({
            gameDirectory: "",
            currentModpack: "",
            ram: 2048,
            cpuCores: 2,
            locale: "ru",
            devMode: false,

            update(value) {
                set(value);
            },
        }),

        { name: "config" },
    ),
);

async function applyConfigDefaults(state: AppConfig) {
    if (state.gameDirectory.length === 0) {
        const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
        const dataDir = isTauri ? await appDataDir() : "/mock-game-directory";
        useAppConfig.setState({ gameDirectory: dataDir });
    }
}

useAppConfig.subscribe(state => applyConfigDefaults(state));
applyConfigDefaults(useAppConfig.getState());
