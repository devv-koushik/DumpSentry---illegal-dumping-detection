import rateLimit from "express-rate-limit";
import env from "../config/env.js";

// Global rate limiter for most API endpoints
export const globalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later." },
});

// Stricter rate limiter for authentication to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes." },
});

// Stricter rate limiter for GPU-heavy analysis endpoints
export const analysisLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 analysis requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Analysis rate limit exceeded. Please wait before submitting more images." },
});
