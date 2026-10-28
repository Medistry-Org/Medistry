import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  // the patient area moved from /dashboard to /patient-dashboard; old links and bookmarks keep working
  async redirects() {
    return [
      { source: "/dashboard", destination: "/patient-dashboard", permanent: true },
      { source: "/dashboard/:path*", destination: "/patient-dashboard/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
