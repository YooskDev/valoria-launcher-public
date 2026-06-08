import { Package, Shirt, Settings, User, Puzzle, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

export function TabBar() {
    const { t } = useTranslation();

    const tabs = [
        { path: "/", id: "index" as const, icon: Package },
        { path: "/skins", id: "skins" as const, icon: Shirt },
        { path: "/mods", id: "mods" as const, icon: Puzzle },
        { path: "/custom-content", id: "customContent" as const, icon: FolderOpen },
        { path: "/profile", id: "profile" as const, icon: User },
        { path: "/settings", id: "settings" as const, icon: Settings },
    ];

    return (
        <div className="flex gap-2 px-5 py-3 border-b border-cyan-800/30">
            {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                    <NavLink
                        to={tab.path}
                        key={tab.id}
                        className={props =>
                            `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                props.isActive ?
                                    "bg-cyan-600 text-white"
                                :   "bg-blue-900/30 text-gray-400 hover:bg-cyan-800/50 hover:text-white"
                            }`
                        }
                    >
                        <Icon size={18} />
                        <span className="font-medium">
                            {t(`layout.navBar.tabs.${tab.id}`)}
                        </span>
                    </NavLink>
                );
            })}
        </div>
    );
}
