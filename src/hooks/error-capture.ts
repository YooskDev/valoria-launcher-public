import { useEffect } from "react";
import { useAppErrors } from "../state/error";

export function useErrorCapture(message: string, error: Error | null) {
    const errors = useAppErrors();

    useEffect(() => {
        if (error === null) {
            return;
        }

        errors.push(`${message}: ${error}`);
    }, [error]);
}
