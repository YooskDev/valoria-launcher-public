import { Minus, X } from "lucide-react";
import styled from "styled-components";
import { getCurrentWindow } from "@tauri-apps/api/window";

const Div = styled.div`
    height: 74px;

    padding: 12px 20px;

    position: absolute;

    top: 0;
    left: 0;
    right: 0;

    z-index: 200;

    display: flex;
    flex-direction: row;
    justify-content: end;
    align-items: center;
    gap: 4px;
`;

const Button = styled.button<{ isClose: boolean }>`
    background: none;
    border: none;

    color: #ffffff;

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    padding: 0.5rem;
    border-radius: 0.625rem;

    transition: 150ms;

    &:hover {
        background: ${props => (props.isClose ? "#e7000b4d" : "#ffffff1a")};
    }
`;

export function WindowTitlebar() {
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (!isTauri) {
        return null;
    }
    const appWindow = getCurrentWindow();

    return (
        <Div data-tauri-drag-region>
            <Button isClose={false} onClick={() => appWindow.minimize()}>
                <Minus />
            </Button>

            <Button isClose={true} onClick={() => appWindow.close()}>
                <X />
            </Button>
        </Div>
    );
}
