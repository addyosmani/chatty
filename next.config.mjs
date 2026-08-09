/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // WebLLM and pdfjs pull in Node built-ins they never use in the browser.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        module: false,
        perf_hooks: false,
      };
    }

    return config;
  },
};

export default nextConfig;
