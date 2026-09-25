/**
 * SERVER-ONLY entrypoint. Re-exports the disk-backed loader
 * (`loadPosts`, `loadPost`, `loadAuthors`, … — node:fs).
 *
 * Prefer this over the barrel from server code when you only need loading:
 *   import { loadPosts } from "@strand-cms/core/server";
 *
 * Never import this — or the `@strand-cms/core` barrel — from a
 * `"use client"` component. Client code that needs URL helpers must use
 * `@strand-cms/core/schema` instead.
 */
export * from "./loader";
