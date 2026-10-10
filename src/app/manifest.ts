import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Apni Madad Foundation",
    short_name: "Apni Madad",
    description: "Direct Peer-to-Peer Medical and Emergency Relief Portal",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/logo-circle.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
