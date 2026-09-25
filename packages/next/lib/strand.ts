// SERVER-ONLY. This module wraps the filesystem loader (POSTS/AUTHORS paths).
// Never import it — or the "@strand-cms/core" barrel — from a "use client"
// component: Turbopack would try to bundle node:fs for the browser. Client
// components that need URLs must import { postPath, tagPath } from
// "@strand-cms/core/schema", or receive plain { href, label } props computed
// in a Server Component.
import { SiteConfig, RoutesConfig } from "@strand-cms/core/schema";
import { join } from "node:path";
import siteCfg from "@/site.config";
import routesCfg from "@/routes.config";

export const site = SiteConfig.parse(siteCfg);
export const routes = RoutesConfig.parse(routesCfg);
export const POSTS = join(process.cwd(), "content/posts");
export const AUTHORS = join(process.cwd(), "content/authors");
