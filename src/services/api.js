
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || "";

        const authRoutes = [
            "/auth/login",
            "/auth/register",
            "/auth/logout",
            "/auth/me",
        ];

        const isAuthRoute = authRoutes.some((route) =>
            url.includes(route)
        );

        if (error.response?.status === 401 && !isAuthRoute) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");

            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default api;
