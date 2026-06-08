import { Gamepad2 } from "lucide-react";

export function Header() {
    return (
        <header className="bg-[#060b16] border-b border-cyan-800/30 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Gamepad2 className="w-8 h-8 text-cyan-400" />
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        YOOSK
                    </h1>
                    <p className="text-xs text-gray-400">Game Launcher</p>
                </div>
            </div>
        </header>
    );
}
