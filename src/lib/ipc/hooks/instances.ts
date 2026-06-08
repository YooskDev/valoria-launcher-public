import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useErrorCapture } from "../../../hooks/error-capture";

export function useInstances(): string[] {
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    const query = useQuery({
        queryKey: ["instances"],
        queryFn: () => invoke<string[]>("list_instances"),
        enabled: isTauri,
    });

    useErrorCapture("Error while getting the list of instances", query.error);

    return isTauri ? (query.data ?? []) : ["Yoosk Modpack", "Vanilla Minecraft"];
}
