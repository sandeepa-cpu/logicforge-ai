import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {};

export default nextConfig;
