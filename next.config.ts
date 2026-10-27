import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright drives the dev server over 127.0.0.1; allow its HMR requests.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      // Comfortably above lib/storage/validation.ts's GALLERY_UPLOAD_MAX_BYTES
      // (5MB) to leave room for multipart/form-data overhead — the real
      // limit enforced on the actual file content is the one in
      // lib/storage/validation.ts, not this transport-level ceiling.
      bodySizeLimit: "6mb",
    },
  },
  // Customer invitations are reached by a shared link, never by search
  // (D-094). A header, unlike the page's robots meta tag, also reaches the
  // invitation's opengraph-image, so its photos stay out of image search.
  // Link previews (WhatsApp etc.) ignore it.
  async headers() {
    return [
      {
        source: "/invite/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noimageindex" }],
      },
    ];
  },
};

export default nextConfig;
