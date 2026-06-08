import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { ServerStatus } from "../types/server-status";

export function useServerStatus(host?: string): ServerStatus | undefined {
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    const query = useQuery({
        queryKey: ["server-status", host],
        queryFn: () => invoke<ServerStatus>("get_server_status", { host }),
        enabled: isTauri && host !== undefined,
        staleTime: 60000,
    });

    return isTauri ? (query.data ?? undefined) : { onlinePlayers: 42, maxPlayers: 100 };
}
