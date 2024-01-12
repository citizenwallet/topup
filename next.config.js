/** @type {import('next').NextConfig} */
const nextConfig = {
  // webpack doesn't understand that .abi files are .json files
  // this helps webpack to understand that
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.abi$/,
      loader: "json-loader",
      type: "javascript/auto", // Required by Webpack v4
    });

    return config;
  },
};

module.exports = nextConfig;
