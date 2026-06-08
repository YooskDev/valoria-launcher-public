import { useModpacks } from "../lib/api/hooks/modpacks";
import { ModpackDto } from "../openapi";
import { useAppConfig } from "../state/config";

export function useCurrentModpack(): ModpackDto | undefined {
    const modpacks = useModpacks();
    const config = useAppConfig();

    const modpack = modpacks.find(
        modpack => modpack.id === config.currentModpack,
    );

    return modpack ?? modpacks[0];
}
