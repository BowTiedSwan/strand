import { ImageResponse } from "next/og";
import { loadPosts, loadPost } from "@strand-cms/core";
import { POSTS, site } from "@/lib/strand";

/**
 * Per-article 1200×630 social card (head-tag audit, 2026-07-19).
 * File-based image metadata outranks the metadata object, so every post
 * gets a real og:image / twitter:image. An explicit frontmatter image
 * (og.image or featureImage) is rendered full-bleed; otherwise a branded
 * title card is generated at build time.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Article social card";

export function generateStaticParams() {
  return loadPosts(POSTS).map((p) => ({ slug: p.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = loadPost(POSTS, slug, {});
  const fm = post?.frontmatter;

  const explicit = fm?.og?.image ?? fm?.featureImage?.src;
  if (explicit) {
    const src = new URL(explicit, site.url).toString();
    return new ImageResponse(
      (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          width={size.width}
          height={size.height}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ),
      size,
    );
  }

  const date = fm
    ? new Date(fm.updatedAt ?? fm.publishedAt).toLocaleDateString("en", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#101014",
          color: "#f4f4f2",
          fontSize: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14, height: 14, borderRadius: 7, background: "#e8503a",
            }}
          />
          <div style={{ fontSize: 34, letterSpacing: 2, textTransform: "uppercase" }}>
            {site.name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: fm && fm.title.length > 48 ? 58 : 68,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {fm?.title ?? site.name}
        </div>

        <div style={{ display: "flex", gap: 28, fontSize: 28, color: "#b9b9b4" }}>
          {fm?.tags[0] && <div>{`#${fm.tags[0]}`}</div>}
          <div>{date}</div>
        </div>
      </div>
    ),
    size,
  );
}
