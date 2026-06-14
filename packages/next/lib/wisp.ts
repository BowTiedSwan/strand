import { SiteConfig, RoutesConfig } from "@wisp/core";
import { join } from "node:path";
import siteCfg from "@/site.config";
import routesCfg from "@/routes.config";

export const site = SiteConfig.parse(siteCfg);
export const routes = RoutesConfig.parse(routesCfg);
export const POSTS = join(process.cwd(), "content/posts");
export const AUTHORS = join(process.cwd(), "content/authors");
