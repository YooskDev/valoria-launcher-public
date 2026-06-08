import { useEffect } from "react";
import { useNavigate } from "react-router";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProfileDto } from "../openapi";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface AppAuthState {
    accessToken: string;
    expiresAt: string;
    autoRefresh: boolean;
}

export interface AppAuth {
    state?: AppAuthState;

    setState(state: AppAuthState): void;
    logout(): void;
}

export const useAppAuth = create<AppAuth>()(
    persist(
        set => ({
            setState(state) {
                set({ state });
            },

            logout() {
                set({ state: undefined });
            },
        }),

        { name: "auth" },
    ),
);

export function useAppAuthState(): AppAuthState | undefined {
    const navigate = useNavigate();
    const auth = useAppAuth();

    useEffect(() => {
        if (auth.state === undefined) {
            navigate("/sign-in");
        }
    }, [auth]);

    return auth.state;
}

export function useProfile(): ProfileDto | undefined {
    const auth = useAppAuth();
    const authState = useAppAuthState();
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    const { data, error } = useQuery({
        queryKey: ["profile"],
        queryFn: async () =>
            await api.getProfile(null, undefined, {
                headers: { "X-Access-Token": authState!.accessToken },
            }),
        enabled: isTauri && authState !== undefined,
    });

    useEffect(() => {
        if (isTauri && error !== null) {
            auth.logout();
        }
    }, [error, isTauri]);

    if (!isTauri) {
        return authState !== undefined ? {
            id: "mock-user-id",
            username: "Lesha",
            email: "lesha@yoosk.ru",
            hasTotp: false,
            forcedTotp: false,
            slimArms: false,
            skinUrl: "https://textures.minecraft.net/texture/c09c256086f6a73c2419a4e3208f88bb82d2a45af44c207b5db30e7fa38a6a68",
            createdAt: new Date().toISOString(),
        } as any : undefined;
    }

    return data?.data;
}
