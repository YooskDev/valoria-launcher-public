/// <reference types="vite/client" />

interface ViteTypeOptions {
    strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
    readonly VITE_SERVICES_URL: string;
    readonly VITE_TOKEN_REFRESH_TIME_MARGIN: string;
    readonly APP_VERSION: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
