import type { MetadataRoute } from "next";
import { robotsMetadata } from "@strand-cms/core";
import { site } from "@/lib/strand";

export default function robots(): MetadataRoute.Robots {
  return robotsMetadata(site);
}
