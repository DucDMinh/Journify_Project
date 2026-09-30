import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Region } from "@/interface";

export const REGION_FALLBACK_COVERS: Record<string, string> = {
    "mien-bac": "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=900&auto=format&fit=crop",
    "mien-trung": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=900&auto=format&fit=crop",
    "tay-nguyen": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=900&auto=format&fit=crop",
    "mien-nam": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=900&auto=format&fit=crop",
};

export const REGION_GRADIENTS: Record<string, string> = {
    "mien-bac": "from-rose-500 to-amber-500",
    "mien-trung": "from-emerald-500 to-teal-500",
    "tay-nguyen": "from-purple-500 to-indigo-500",
    "mien-nam": "from-orange-500 to-yellow-500",
};

// Ảnh vùng dùng bộ ảnh cố định để 4 thẻ đồng nhất; ảnh tỉnh trong DB chỉ dùng cho từng tỉnh.
export const regionCover = (region: Pick<Region, "key" | "cover">) => REGION_FALLBACK_COVERS[region.key] ?? region.cover ?? "";

export const useRegions = () => {
    const [regions, setRegions] = useState<Region[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;
        api.get<Region[]>("/provinces/regions")
            .then(({ response, data }) => {
                if (ignore) return;
                if (!response.ok || !data.data) throw new Error(data.message || "Không tải được vùng miền");
                setRegions(data.data);
            })
            .catch((err: unknown) => {
                if (!ignore) setError(err instanceof Error ? err.message : "Không tải được vùng miền");
            });
        return () => {
            ignore = true;
        };
    }, []);

    return { regions, error, isLoading: regions === null && !error };
};
