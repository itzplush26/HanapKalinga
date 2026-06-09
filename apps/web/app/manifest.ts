import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HanapKalinga",
    short_name: "HanapKalinga",
    description:
      "Find verified private duty nurses and caregivers in the Philippines.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafb",
    theme_color: "#0d9488",
    icons: [
      {
        src: "/icon.png",
        sizes: "500x500",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon.png",
        sizes: "500x500",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
