import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "안스리움 컬렉션",
    short_name: "Anthurium",
    description: "안스리움 도감과 브리딩 계보 기록",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e8",
    theme_color: "#102a22",
    lang: "ko",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
