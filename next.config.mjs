import * as path from 'path';

const __dirname = path.resolve();

/** @type {import('next').NextConfig} */
const nextConfig = {

  // Override the default webpack configuration
  webpack: (config, { isServer }) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
      // Handle pdfjs-dist canvas dependency (not needed for text extraction)
      "canvas": false,
    };

    // Fix for @huggingface/transformers bundling issue
    // https://huggingface.co/docs/transformers.js/tutorials/next
    // Point to the web build to avoid node: imports
    config.resolve.alias['@huggingface/transformers'] = path.resolve(
      __dirname,
      'node_modules/@huggingface/transformers/dist/transformers.js',
    );

    // Provide fallbacks for node modules in browser (for sql.js)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
