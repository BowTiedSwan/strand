import type { RoutesConfig } from "@strand-cms/core";
const routes = { post: "/blog/{slug}", tag: "/tag/{tag}", author: "/author/{author}" } satisfies Partial<RoutesConfig>;
export default routes;
