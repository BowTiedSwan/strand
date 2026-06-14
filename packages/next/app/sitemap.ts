import type { MetadataRoute } from "next";
import { loadPosts, buildSitemap } from "@wisp/core";
import { POSTS, site, routes } from "@/lib/wisp";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(loadPosts(POSTS), site, routes).map((e) => ({
    url: e.url, lastModified: e.lastModified, changeFrequency: e.changeFrequency, priority: e.priority,
  }));
}
