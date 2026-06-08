export interface ModpackOptionalFile {
    name: string;
    description: string | null;
    category: string | null;
    version: string | null;
    author: string | null;
    path: string;
    default: boolean;
}
