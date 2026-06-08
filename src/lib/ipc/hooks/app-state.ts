import { AppState } from "../types/app-state";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

export function useAppState(): AppState {
    const [state, setState] = useState<AppState>({
        gameState: "starting",
        currentTask: null,
    });

    useEffect(() => {
        const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
        if (!isTauri) {
            setState({ gameState: "stopped", currentTask: null });
            return;
        }

        invoke<AppState>("get_state").then(currentState => {
            setState(currentState);
        });

        const listener = listen<AppState>("state", event => {
            setState(event.payload);
        });

        return () => {
            listener.then(unlisten => unlisten());
        };
    }, []);

    return state;
}
