export interface RunModpackData {
    gameDir: string;
    modpackId: string;

    bundleUrl: string;
    bundleCrc32: string;

    jvmArgs: string[];
    gameArgs: { [key: string]: string };

    optionalFiles: { [key: string]: boolean };
}
