import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "PHOTIZO Network International", short_name: "PHOTIZO", description: "Prayer, teaching, and ministry life with PHOTIZO.", start_url: "/", scope: "/", display: "standalone", display_override: ["standalone","minimal-ui"], background_color: "#fbfaf6", theme_color: "#486c26", icons: [{src:"/icons/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/icons/icon-512.png",sizes:"512x512",type:"image/png"},{src:"/icons/icon-maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}] };
}
