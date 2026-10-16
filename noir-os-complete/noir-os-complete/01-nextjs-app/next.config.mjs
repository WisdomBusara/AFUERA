/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actions are stable in Next 15; keep body size room for future uploads.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
