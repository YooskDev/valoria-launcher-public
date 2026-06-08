import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router";
import SignIn from "./pages/SignIn";
import { Settings } from "./pages/Settings";
import { Skins } from "./pages/Skins";
import { Mods } from "./pages/Mods";
import { Home } from "./pages/Home";
import { CustomContent } from "./pages/CustomContent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import { MainLayout } from "./layout/MainLayout";
import { Profile } from "./pages/Profile";
import { AuthRefresh } from "./components/AuthRefresh";
import { ErrorOverlay } from "./layout/ErrorOverlay";
import { LocaleChange } from "./layout/LocaleChange";
import { WindowTitlebar } from "./components/ui/WindowTitlebar";

import "./styles/index.css";
import { UpdateBoundary } from "./components/UpdateBoundary";

const queryClient = new QueryClient();

i18n.use(initReactI18next)
    .use(Backend)
    .init({
        backend: { loadPath: "/locales/{{lng}}.json" },

        lng: "en",
        fallbackLng: "en",

        interpolation: { escapeValue: false },
    });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ErrorOverlay />
            <AuthRefresh />
            <LocaleChange />

            <WindowTitlebar />

            <UpdateBoundary>
                <HashRouter>
                    <Routes>
                        <Route path="sign-in" element={<SignIn />} />

                        <Route element={<MainLayout />}>
                            <Route index element={<Home />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="skins" element={<Skins />} />
                            <Route path="mods" element={<Mods />} />
                            <Route path="custom-content" element={<CustomContent />} />
                            <Route path="profile">
                                <Route index element={<Profile />} />
                            </Route>
                        </Route>
                    </Routes>
                </HashRouter>
            </UpdateBoundary>
        </QueryClientProvider>
    </React.StrictMode>,
);
