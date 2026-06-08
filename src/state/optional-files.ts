import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ModpackOptionalFile } from "../lib/ipc/types/modpack-optional-file";

export interface OptionalFilesState {
    modpacks: { [modpackId: string]: { [filePath: string]: boolean } };

    getValues(modpackId: string): { [filePath: string]: boolean };
    getValue(
        base: ModpackOptionalFile[],
        modpackId: string,
        filePath: string,
    ): boolean;
    update(modpackId: string, filePath: string, value: boolean): void;
}

export const useOptionalFiles = create<OptionalFilesState>()(
    persist(
        set => ({
            modpacks: {},

            getValues(modpackId) {
                return this.modpacks[modpackId] ?? {};
            },

            getValue(base, modpackId, filePath) {
                return (
                    this.modpacks[modpackId]?.[filePath]
                    ?? base.find(f => f.path === filePath)?.default
                    ?? false
                );
            },

            update(modpackId, filePath, value) {
                const newModpacks = { ...this.modpacks };

                if (!(modpackId in newModpacks)) {
                    newModpacks[modpackId] = {};
                }

                newModpacks[modpackId][filePath] = value;

                set({ modpacks: newModpacks });
            },
        }),

        { name: "optional-files" },
    ),
);
