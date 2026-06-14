import type { Ctx } from "./context";

export interface AnalyticsArgs {
  slug?: string;
  range: "7d" | "28d" | "90d";
  metrics: ("pageviews" | "visitors" | "referrers" | "ai_referrers")[];
}

// Hosts that indicate a referral from an AI search engine / assistant.
const AI_HOSTS = [
  "chatgpt.com", "chat.openai.com", "perplexity.ai", "gemini.google.com",
  "claude.ai", "copilot.microsoft.com", "bing.com/chat", "you.com",
];

const PERIOD: Record<AnalyticsArgs["range"], string> = { "7d": "7d", "28d": "30d", "90d": "6mo" };

export async function getAnalytics(ctx: Ctx, args: AnalyticsArgs) {
  const provider = ctx.analytics.provider;
  if (provider === "plausible") return plausible(ctx, args);
  if (provider === "none") {
    return { provider, configured: false, note: "No analytics adapter configured for this site." };
  }
  return {
    provider,
    configured: false,
    note: `Analytics reads for "${provider}" aren't implemented yet. Plausible is supported; ` +
      `others return live data once an adapter is added. Set keys via env.`,
  };
}

async function plausible(ctx: Ctx, args: AnalyticsArgs) {
  const key = process.env.PLAUSIBLE_API_KEY;
  const domain = ctx.analytics.domain ?? process.env.WISP_ANALYTICS_DOMAIN;
  if (!key || !domain) {
    return {
      provider: "plausible",
      configured: false,
      note: "Set PLAUSIBLE_API_KEY and WISP_ANALYTICS_DOMAIN to enable reads.",
    };
  }
  const period = PERIOD[args.range];
  const base = "https://plausible.io/api/v1/stats";
  const filters = args.slug ? `&filters=${encodeURIComponent(`event:page==/blog/${args.slug}`)}` : "";
  const headers = { Authorization: `Bearer ${key}` };

  const result: Record<string, unknown> = { provider: "plausible", configured: true, range: args.range, scope: args.slug ?? "site" };

  // Aggregate metrics.
  if (args.metrics.includes("pageviews") || args.metrics.includes("visitors")) {
    const r = await fetch(
      `${base}/aggregate?site_id=${encodeURIComponent(domain)}&period=${period}&metrics=pageviews,visitors${filters}`,
      { headers },
    );
    result.aggregate = r.ok ? ((await r.json()) as unknown) : { error: r.status };
  }

  // Referrer breakdown, with AI sources isolated.
  if (args.metrics.includes("referrers") || args.metrics.includes("ai_referrers")) {
    const r = await fetch(
      `${base}/breakdown?site_id=${encodeURIComponent(domain)}&period=${period}&property=visit:source${filters}`,
      { headers },
    );
    if (r.ok) {
      const data = (await r.json()) as { results?: { source: string; visitors: number }[] };
      const rows = data.results ?? [];
      if (args.metrics.includes("referrers")) result.referrers = rows.slice(0, 20);
      if (args.metrics.includes("ai_referrers")) {
        result.ai_referrers = rows.filter((x) =>
          AI_HOSTS.some((h) => x.source.toLowerCase().includes(h.split("/")[0]!)),
        );
      }
    } else {
      result.referrersError = r.status;
    }
  }

  return result;
}
