import { MetadataRoute } from "next";
import { getPublicCases } from "@/lib/actions/cases";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apnimadad-web.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cases`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/women-help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/satta-mukt`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    const cases = await getPublicCases();
    const caseRoutes: MetadataRoute.Sitemap = cases.map((c) => ({
      url: `${baseUrl}/cases/${c.id}`,
      lastModified: new Date(c.updated_at || c.created_at || Date.now()),
      changeFrequency: "daily",
      priority: 0.85,
    }));

    return [...staticRoutes, ...caseRoutes];
  } catch {
    return staticRoutes;
  }
}
