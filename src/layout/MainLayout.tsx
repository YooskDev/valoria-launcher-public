import { Outlet } from "react-router";
import { Header } from "../components/generated/Header";
import { TabBar } from "../components/generated/TabBar";
import { useProfile } from "../state/auth";
import { Loader2 } from "lucide-react";

export function MainLayout() {
    const profile = useProfile();

    if (profile === undefined) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <Loader2 className="animate-spin" size={64} color="white" />
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-[#0a0e1a] overflow-hidden mx-auto text-white">
            <div className="h-full flex flex-col">
                <Header />
                <TabBar />

                <main className="flex-1 p-5 overflow-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
