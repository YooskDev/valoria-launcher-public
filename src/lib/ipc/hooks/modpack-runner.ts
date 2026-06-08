import { useMutation } from "@tanstack/react-query";
import { useAppConfig } from "../../../state/config";
import { invoke } from "@tauri-apps/api/core";
import { RunModpackData } from "../types/run-modpack-data";
import { useAppAuthState, useProfile } from "../../../state/auth";
import { api } from "../../api";
import { useOptionalFiles } from "../../../state/optional-files";
import { useAppErrors } from "../../../state/error";

export function useModpackRunner() {
    const errors = useAppErrors();

    const optionalFiles = useOptionalFiles();
    const auth = useAppAuthState();
    const profile = useProfile();
    const config = useAppConfig();

    return useMutation({
        mutationKey: ["run-modpack"],

        mutationFn: async (params: { id: string }) => {
            const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
            if (!isTauri) {
                console.log("Mocking run_modpack locally for:", params.id);
                return;
            }

            const { data: bundle } = await api.getModpackBundle(
                { id: params.id },
                undefined,
                { headers: { "X-Access-Token": auth?.accessToken } },
            );

            await invoke("run_modpack", {
                data: {
                    modpackId: params.id,

                    bundleUrl: bundle.url,
                    bundleCrc32: bundle.checksum,

                    gameDir: config.gameDirectory,

                    gameArgs: {
                        "--username": profile?.username ?? "",
                        "--uuid": profile?.id ?? "",
                        "--accessToken": auth?.accessToken ?? "",
                        "--session": `token:${auth?.accessToken}:${profile?.id}`,
                    },

                    jvmArgs: [
                        `-Xmx${config.ram}M`,
                        `-Xms${config.ram}M`,
                        `-XX:ActiveProcessorCount=${config.cpuCores}`,
                    ],

                    optionalFiles: optionalFiles.getValues(params.id),
                } satisfies RunModpackData,
            });
        },

        onError(error, _variables, _onMutateResult, _context) {
            errors.push(`Error while running modpack: ${error}`);
        },
    });
}
