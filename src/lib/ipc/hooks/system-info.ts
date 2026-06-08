import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useErrorCapture } from "../../../hooks/error-capture";
import { SystemInfo } from "../types/system-info";

export function useSystemInfo(): SystemInfo {
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    const query = useQuery({
        queryKey: ["system-info"],
        queryFn: () => invoke<SystemInfo>("get_system_info"),
        enabled: isTauri,
    });

    useErrorCapture("Error while getting system info", query.error);

    return isTauri ? (query.data ?? { totalMemory: 0, cpus: 0 }) : { totalMemory: 16384, cpus: 8 };
}
