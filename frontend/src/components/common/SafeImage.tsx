"use client";

import { useState, type ImgHTMLAttributes } from "react";

export const DEFAULT_TRIP_IMAGE = "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1000&auto=format&fit=crop";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src?: string | null;
    fallback?: string;
};

export default function SafeImage({ src, fallback = DEFAULT_TRIP_IMAGE, alt = "", ...rest }: SafeImageProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const current = src && src !== failedSrc ? src : fallback;

    return (
        <img
            {...rest}
            src={current}
            alt={alt}
            onError={() => {
                if (src && current === src) setFailedSrc(src);
            }}
        />
    );
}
