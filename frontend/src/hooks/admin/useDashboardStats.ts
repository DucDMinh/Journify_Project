import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { DashboardStats } from "@/interface";

export const RANGE_OPTIONS = [
    { months: 3, label: "3 tháng" },
    { months: 6, label: "6 tháng" },
    { months: 12, label: "12 tháng" },
] as const;

export const useDashboardStats = (initialMonths: number = 6) => {
    const [months, setMonths] = useState(initialMonths);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        () =>
            api
                .get<DashboardStats>(`/stats/overview?months=${months}`)
                .then(({ response, data }) => {
                    if (!response.ok || !data.data) throw new Error(data.message || "Không tải được thống kê");
                    setStats(data.data);
                    setError(null);
                })
                .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không tải được thống kê"))
                .finally(() => setIsLoading(false)),
        [months],
    );

    useEffect(() => {
        load();
    }, [load]);

    const changeRange = (next: number) => {
        setIsLoading(true);
        setMonths(next);
    };

    const refresh = () => {
        setIsLoading(true);
        return load();
    };

    return { stats, isLoading, error, months, changeRange, refresh };
};
