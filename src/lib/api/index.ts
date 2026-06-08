import OpenAPIClientAxios, { OpenAPIV3 } from "openapi-client-axios";
import axios, { AxiosError } from "axios";
import { Client } from "../../openapi";
import definition from "./openapi.json";
import { invoke } from "@tauri-apps/api/core";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const tauriAdapter = async (config: any) => {
    try {
        const url = config.url;
        const finalUrl = config.baseURL
            ? `${config.baseURL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
            : url;

        const headers: Record<string, string> = {};
        if (config.headers) {
            Object.entries(config.headers).forEach(([k, v]) => {
                if (v !== undefined && v !== null) {
                    headers[k] = String(v);
                }
            });
        }

        const response: {
            status: number;
            headers: Record<string, string>;
            body: string;
        } = await invoke("forward_api_request", {
            req: {
                method: config.method?.toUpperCase() || "GET",
                url: finalUrl,
                headers,
                body: config.data
                    ? typeof config.data === "string"
                        ? config.data
                        : JSON.stringify(config.data)
                    : null,
            },
        });

        let data = response.body;
        try {
            data = JSON.parse(response.body);
        } catch (e) {
            // Keep as string
        }

        const axiosResponse = {
            data,
            status: response.status,
            statusText: "",
            headers: response.headers as any,
            config,
            request: null,
        };

        if (response.status >= 200 && response.status < 300) {
            return axiosResponse;
        } else {
            throw new AxiosError(
                `Request failed with status code ${response.status}`,
                response.status.toString(),
                config,
                null,
                axiosResponse
            );
        }
    } catch (err: any) {
        if (err instanceof AxiosError) {
            throw err;
        }
        throw new AxiosError(
            err.message || String(err) || "Network Error",
            undefined,
            config,
            null,
            undefined
        );
    }
};

const axiosInstance = axios.create({
    adapter: isTauri ? (tauriAdapter as any) : undefined,
});

const client = new OpenAPIClientAxios({
    definition: definition as OpenAPIV3.Document,
    withServer: { url: import.meta.env.VITE_SERVICES_URL },
    axiosInstance,
});

export const api = client.initSync<Client>();
