import { useTranslation } from "react-i18next";
import { useAppConfig } from "../state/config";
import { useEffect } from "react";

export function LocaleChange() {
    const { i18n } = useTranslation();
    const config = useAppConfig();

    useEffect(() => {
        i18n.changeLanguage(config.locale);
    }, [config.locale]);

    return <></>;
}
