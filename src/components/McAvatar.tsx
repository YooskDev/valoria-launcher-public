import { HTMLAttributes, useEffect, useRef, useState } from "react";

interface McAvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "ref"> {
    skinUrl: string;
}

export function McAvatar(props: McAvatarProps) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const div = useRef<HTMLDivElement>(null);
    const img = useRef<HTMLImageElement>(null);

    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        if (
            canvas.current === null
            || div.current === null
            || img.current === null
            || !imageLoaded
        ) {
            return;
        }

        canvas.current.width = div.current.clientWidth;
        canvas.current.height = div.current.clientHeight;

        const context = canvas.current.getContext("2d");

        if (context === null) {
            return;
        }

        context.imageSmoothingEnabled = false;

        context.drawImage(
            img.current,
            8,
            8,
            8,
            8,
            0,
            0,
            canvas.current.width,
            canvas.current.height,
        );

        context.drawImage(
            img.current,
            40,
            8,
            8,
            8,
            -4,
            -4,
            canvas.current.width + 4 * 2,
            canvas.current.height + 4 * 2,
        );
    }, [canvas, div, imageLoaded]);

    return (
        <div ref={div} {...props} style={{ overflow: "hidden" }}>
            <img
                ref={img}
                style={{ display: "none" }}
                src={props.skinUrl}
                onLoad={() => setImageLoaded(true)}
            />

            <canvas ref={canvas} style={{ imageRendering: "pixelated" }} />
        </div>
    );
}
