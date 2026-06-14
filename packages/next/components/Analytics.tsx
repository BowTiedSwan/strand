// Cookieless by default. Swap data-domain for your domain, or replace with another adapter.
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;
  return <script defer data-domain="wisp.example" src="https://plausible.io/js/script.js" />;
}
