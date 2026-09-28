import dotenv from "dotenv";
dotenv.config();
export const env = {
    NODE_ENV: process.env.NODE_ENV ||
        "development",
    PORT: Number(process.env.PORT || 5000),
    CLIENT_URL: process.env.CLIENT_URL ||
        "http://localhost:5173",
    MONGODB_URI: process.env.MONGODB_URI || "",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ||
        "",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ||
        "",
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES ||
        "15m",
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ||
        "7d",
    COOKIE_SECURE: process.env.COOKIE_SECURE ===
        "true",
    AI_ENGINE_URL: process.env.AI_ENGINE_URL ||
        "http://127.0.0.1:8000",
};
