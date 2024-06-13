import bundleAnalyzer from '@next/bundle-analyzer';

// configuring the @next/bundle-analyzer plugin
const withBundleAnalyzer = bundleAnalyzer({
  enabled: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // if you miss it, all the other options in fallback, specified
        // by next.js will be dropped. Doesn't make much sense, but how it is
        fs: false, // the solution
        module: false,
        perf_hooks: false,
      };
    }
    // This is to fix transformers.js error
    // https://github.com/xenova/transformers.js/blob/main/examples/next-client/next.config.js
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    return config;
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

// wrapping the nextConfig with the @next/bundle-analyzer plugin to enable the bundle analyzer
// it should generate three files: client.html, edge.html, and nodejs.html under the .next/analyze folder
export default withBundleAnalyzer(nextConfig);
