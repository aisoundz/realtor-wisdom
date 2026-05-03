/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Serve the static marketing HTML at the root URL for unauthenticated visitors.
  // Authenticated users are redirected to /dashboard by middleware before this fires.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/marketing.html' },
      ],
    };
  },
};

export default nextConfig;
