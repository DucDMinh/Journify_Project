import { useEffect, useRef } from "react";

export const useAutoRefresh = (refresh: () => unknown, intervalMs = 30_000) => {
    const latest = useRef(refresh);

    useEffect(() => {
        latest.current = refresh;
    }, [refresh]);

    useEffect(() => {
        const run = () => {
            if (document.visibilityState === "visible") latest.current();
        };
        const timer = window.setInterval(run, intervalMs);
        window.addEventListener("focus", run);
        document.addEventListener("visibilitychange", run);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener("focus", run);
            document.removeEventListener("visibilitychange", run);
        };
    }, [intervalMs]);
};
