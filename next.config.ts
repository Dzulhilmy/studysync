import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow <img> tags for avatars that may be blob:, data:, or unregistered
  // remote URLs. The eslint-disable comment in Avatar.tsx suppresses the
  // no-img-element rule on that specific element.
  //
  // If you later move avatar storage to a fixed CDN (e.g. Cloudinary, S3),
  // add a remotePatterns entry here and switch back to <Image>.
  images: {
    // Permit any remote hostname so next/image can optimise images when used
    // elsewhere in the app (banners, thumbnails, etc.)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',   // wildcard — lock this down once your CDN is confirmed
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Allow inline data: URIs (e.g. base64 previews) globally
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
}

export default nextConfig
