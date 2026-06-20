const ADMIN = process.env.NEXT_PUBLIC_API_BASE;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!ADMIN) return [];
    return [{ source: '/api/:path*', destination: `${ADMIN}/api/:path*` }];
  },
};

export default nextConfig;
