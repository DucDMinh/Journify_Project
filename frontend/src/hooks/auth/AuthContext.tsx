/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { User } from "@/interface";
import { api } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Toaster, toast } from 'sonner';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isReady: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    refreshSession: () => Promise<User | null>;
}

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredSession = () => {
    try {
        const storedToken = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("userData");
        return storedToken && storedUser ? { token: storedToken, user: JSON.parse(storedUser) as User } : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const router = useRouter();

    const persist = useCallback((newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem("accessToken", newToken);
        localStorage.setItem("userData", JSON.stringify(userData));
        document.cookie = `accessToken=${newToken}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`;
    }, []);

    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
        document.cookie = "accessToken=; path=/; max-age=0";
    }, []);

    const refreshSession = useCallback(async () => {
        const { response, data } = await api.get<undefined>("/auth/refresh-token");
        if (response.ok && data.token && data.user) {
            persist(data.token as string, data.user as User);
            return data.user as User;
        }
        if (response.status === 401 || response.status === 403) {
            clearSession();
            if (data.code === "ACCOUNT_DISABLED") toast.error(data.message || "Tài khoản của bạn đã bị vô hiệu hóa");
        }
        return null;
    }, [persist, clearSession]);

    useEffect(() => {
        const stored = readStoredSession();
        if (stored) {
            setToken(stored.token);
            setUser(stored.user);
            refreshSession().catch(() => undefined);
        }
        setIsReady(true);
    }, [refreshSession]);

    const logout = () => {
        clearSession();
        toast.success("Đã đăng xuất thành công!");
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isReady, login: persist, logout, refreshSession }}>
            <Toaster duration={2500} richColors closeButton position="bottom-right" />
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
    }
    return context;
};
