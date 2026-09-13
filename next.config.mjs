/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite", "pg", "bcryptjs"],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { pg: "commonjs pg", "@electric-sql/pglite": "commonjs @electric-sql/pglite" }];
    return config;
  },
};

export default nextConfig;
