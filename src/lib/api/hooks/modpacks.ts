import { useQuery } from "@tanstack/react-query";
import { ModpackDto } from "../../../openapi";
import { api } from "..";
import { useAppAuthState, useProfile } from "../../../state/auth";
import { useErrorCapture } from "../../../hooks/error-capture";

export function useModpacks(): ModpackDto[] {
    const profile = useProfile();
    const auth = useAppAuthState();
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    const query = useQuery({
        queryKey: ["modpacks"],

        queryFn: () =>
            api.getModpacks(null, undefined, {
                headers: { "X-Access-Token": auth?.accessToken },
            }),

        enabled:
            isTauri
            && profile !== undefined
            && profile.ban === undefined
            && (profile.hasTotp || !profile.forcedTotp),
    });

    useErrorCapture("Error while fetching modpacks", query.error);

    return isTauri ? (query.data?.data.modpacks ?? []) : [
        {
            id: "yoosk-main",
            name: "Yoosk Main Modpack",
            description: "The official premium modpack for the Yoosk Minecraft server network. Includes performance optimizations, custom resource packs, and premium visual mods.",
            iconUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80",
            builds: []
        } as any
    ];
}
