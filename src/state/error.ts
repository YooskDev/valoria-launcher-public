import { create } from "zustand";

export interface AppErrorsState {
    errors: string[];

    push(error: string): void;
    clear(): void;
}

export const useAppErrors = create<AppErrorsState>()(set => ({
    errors: [],

    push(error) {
        set({ errors: [...this.errors, error] });
    },

    clear() {
        set({ errors: [] });
    },
}));
