import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
