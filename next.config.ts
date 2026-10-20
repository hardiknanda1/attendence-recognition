import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Keep the SMTP client as a plain Node dependency rather than bundling it.
  serverExternalPackages: ["nodemailer"],
  async headers() {
    return [
      {
        // Animation frames are immutable assets; cache them aggressively.
        source: "/frames/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
