import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.fakesheets.douglasluz.com/sitemap.xml",
    host: "https://www.fakesheets.douglasluz.com",
  };
}
