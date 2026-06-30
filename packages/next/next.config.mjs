import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx"],
  turbopack: { root },
  async rewrites() {
    return [{ source: "/blog/:slug.md", destination: "/blog-md/:slug" }];
  },
};
export default nextConfig;
