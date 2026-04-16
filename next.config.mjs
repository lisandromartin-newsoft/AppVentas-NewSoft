/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Paquetes que deben tratarse como externos en el servidor (no bundleados por webpack)
    serverComponentsExternalPackages: [
      "@prisma/client",
      "prisma",
      "@react-pdf/renderer",
    ],
  },
};

export default nextConfig;
