import { useEffect } from "react";
import { useAppAuth } from "../state/auth";
import { api } from "../lib/api";

export function AuthRefresh() {
    const auth = useAppAuth();

    useEffect(() => {
        const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
        if (!isTauri) {
            return;
        }

        function refresh() {
            if (auth.state === undefined) {
                return;
            }

            if (!auth.state.autoRefresh) {
                return;
            }

            const expiresAt = new Date(auth.state.expiresAt);
            const diff = Math.max(0, expiresAt.getTime() - Date.now());

            if (
                diff <= parseInt(import.meta.env.VITE_TOKEN_REFRESH_TIME_MARGIN)
            ) {
                api.exchangeAccessToken(null, undefined, {
                    headers: { "X-Access-Token": auth.state.accessToken },
                }).then(response => {
                    auth.setState({
                        accessToken: response.data.token,
                        expiresAt: response.data.expiresAt,
                        autoRefresh: true,
                    });
                });
            }
        }

        refresh();

        const interval = setInterval(
            () => {
                refresh();
            },
            1000 * 60 * 5,
        );

        return () => clearInterval(interval);
    }, []);

    return <></>;
}
