import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apnimadad-web.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/cases", "/donate", "/submit", "/women-help", "/satta-mukt"],
      disallow: ["/admin", "/dashboard", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
