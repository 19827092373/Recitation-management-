import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 启用静态导出
  basePath: '/commenter', // 子目录路径，与部署路径一致
  images: {
    unoptimized: true, // 静态导出需禁用内置图片优化
  },
};

export default nextConfig;
