import type { PostFrontmatter } from "@strand-cms/core";

export interface PostSummaryDTO {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  type: PostFrontmatter["type"];
  readingTimeMinutes: number;
  url: string;
}

export interface PostDTO extends PostSummaryDTO {
  summary?: string;
  faq: { q: string; a: string }[];
  sources: { title: string; url: string; publisher?: string }[];
  body: string;
}

export interface AuthorDTO {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  sameAs: string[];
}

export interface TagDTO {
  tag: string;
  count: number;
}

export interface Snapshot {
  generatedAt: string;
  site: { name: string; url: string };
  posts: PostDTO[];
  authors: AuthorDTO[];
  tags: TagDTO[];
}
