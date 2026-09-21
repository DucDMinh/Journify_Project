export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ApiEnvelope<T = unknown> {
    success: boolean;
    message?: string;
    data: T;
    [key: string]: unknown;
}

export interface ApiResult<T = unknown> {
    response: Response;
    data: ApiEnvelope<T>;
}

type Body = FormData | object | undefined;

const getStoredToken = () => {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem("accessToken");
    } catch {
        return null;
    }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
    const headers = new Headers(options.headers ?? {});
    const token = getStoredToken();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers, credentials: "include" });
    const data = (await response.json().catch(() => ({ success: false, data: null }))) as ApiEnvelope<T>;
    return { response, data };
}

const serialize = (body: Body) => (body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body));

export const api = {
    get: <T = unknown>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: "GET" }),
    post: <T = unknown>(url: string, body?: Body, options?: RequestInit) =>
        request<T>(url, { ...options, method: "POST", body: serialize(body) }),
    patch: <T = unknown>(url: string, body?: Body, options?: RequestInit) =>
        request<T>(url, { ...options, method: "PATCH", body: serialize(body) }),
    put: <T = unknown>(url: string, body?: Body, options?: RequestInit) =>
        request<T>(url, { ...options, method: "PUT", body: serialize(body) }),
    delete: <T = unknown>(url: string, options?: RequestInit) => request<T>(url, { ...options, method: "DELETE" }),
};
