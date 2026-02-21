import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Google 프로필 이미지 도메인 허용
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
  // 법령정보센터 도메인 허용
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
