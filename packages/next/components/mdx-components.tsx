import type { MDXComponents } from "mdx/types";

// Components available to MDX article bodies. Keep this small and intentional.
export const mdxComponents: MDXComponents = {
  Callout: ({ children }: { children: React.ReactNode }) => (
    <div className="callout">{children}</div>
  ),
};
