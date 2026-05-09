import type { MetadataRoute } from "next";

import { getPublishedPrograms } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const programs = await getPublishedPrograms();

  const staticRoutes = [
    "",
    "/about",
    "/teachings",
    "/programs",
    "/ask-a-question",
    "/contact",
    "/salvation",
    "/salvation/prayer",
    "/salvation/welcome",
  ].map((path) => ({
    url: `${siteConfig.siteUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const programRoutes = programs.map((program) => ({
    url: `${siteConfig.siteUrl}/programs/${program.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...programRoutes];
}
