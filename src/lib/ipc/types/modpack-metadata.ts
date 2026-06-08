import { ModpackOptionalFile } from "./modpack-optional-file";

export interface ModpackMetadata {
    minecraftVersion: string;
    modLoader: string;
    loaderVersion: string | null;

    authServer: string | null;

    optionalFiles: ModpackOptionalFile[];

    modCount: number | null;
}
