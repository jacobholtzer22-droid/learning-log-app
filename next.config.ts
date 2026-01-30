/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'learning-log-app.vercel.app',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
