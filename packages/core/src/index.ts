/**
 * NOTE: this barrel includes `./loader` (node:fs). It is SERVER-ONLY —
 * import it from Server Components, route handlers, and Node scripts only.
 * `"use client"` components must import URL helpers / config schemas from
 * `@strand-cms/core/schema` (client-safe, no fs) or receive precomputed
 * plain data as props. See README "Client vs server".
 */
export * from "./schema";
export * from "./loader";
export * from "./seo/meta";
export * from "./seo/description";
export * from "./seo/jsonld";
export * from "./seo/sitemap";
export * from "./seo/crawl-surface";
export * from "./geo/markdown";
export * from "./geo/llms";
