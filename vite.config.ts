import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-ignore
import obfuscator from "vite-plugin-javascript-obfuscator";
import packageJson from "./package.json";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
    plugins: [
        react(), 
        tailwindcss(),
        obfuscator({
            include: ["src/**/*.js", "src/**/*.ts", "src/**/*.tsx", "src/**/*.jsx"],
            exclude: [/node_modules/],
            apply: "build",
            options: {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.5,
                deadCodeInjection: false,
                debugProtection: false,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                renameGlobals: false,
                rotateStringArray: true,
                selfDefending: false,
                splitStrings: true,
                splitStringsChunkLength: 5,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75,
                stringArrayWrappersCount: 2,
                stringArrayWrappersChainedCalls: true,
                stringArrayWrappersType: 'function',
                unicodeEscapeSequence: false
            }
        })
    ],

    build: {
        target: ["es2020", "safari13"],
        cssTarget: "safari13",
        minify: "esbuild",
    },

    clearScreen: false,

    server: {
        port: 1420,
        strictPort: true,
        host: host || "127.0.0.1",
        hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
        watch: { ignored: ["**/src-tauri/**"] },
    },

    define: { "import.meta.env.APP_VERSION": JSON.stringify(packageJson.version) },
}));
