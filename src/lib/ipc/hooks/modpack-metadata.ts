import { useQuery } from "@tanstack/react-query";
import { ModpackMetadata } from "../types/modpack-metadata";
import { invoke } from "@tauri-apps/api/core";
import { useErrorCapture } from "../../../hooks/error-capture";

export function useModpackMetadata(
    gameDir: string,
    id: string,
): ModpackMetadata | undefined {
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    const query = useQuery({
        queryKey: ["modpack-metadata", gameDir, id],
        queryFn: () =>
            invoke<ModpackMetadata | null>("get_modpack_metadata", {
                gameDir,
                id,
            }),
        enabled: isTauri,
        staleTime: 0,
        refetchOnMount: "always",
    });

    useErrorCapture("Error while getting modpack metadata", query.error);

    return isTauri ? (query.data ?? undefined) : {
        minecraftVersion: "1.20.1",
        modLoader: "Forge",
        loaderVersion: "47.2.0",
        authServer: null,
        optionalFiles: [],
        modCount: 42
    };
}
