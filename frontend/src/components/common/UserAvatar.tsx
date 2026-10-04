"use client";

import { useState } from "react";

interface UserAvatarProps {
    src?: string | null;
    name?: string | null;
    className?: string;
    textClassName?: string;
    toneClassName?: string;
}

export default function UserAvatar({
    src,
    name,
    className = "h-10 w-10",
    textClassName = "text-sm",
    toneClassName = "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]",
}: UserAvatarProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const initial = name?.trim().charAt(0).toUpperCase() || "?";

    if (src && src !== failedSrc) {
        return <img src={src} alt={name ?? ""} onError={() => setFailedSrc(src)} className={`${className} shrink-0 rounded-full object-cover`} />;
    }
    return (
        <span className={`${className} ${textClassName} ${toneClassName} flex shrink-0 items-center justify-center rounded-full font-bold`}>
            {initial}
        </span>
    );
}
