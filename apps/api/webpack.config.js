const path = require("path");
const nodeExternals = require("webpack-node-externals");

const SRC_DIR = path.resolve(__dirname, "src");
const EMPTY_MODULE = path.resolve(SRC_DIR, "lib/empty.ts");

module.exports = function modifyWebpackConfig(options) {
  const isDev = options.mode === "development";

  // 1. Completely Disable Type-Checking Process (Dev & Prod)
  if (options.plugins) {
    const forkTsPluginIndex = options.plugins.findIndex(
      p => p?.constructor?.name === "ForkTsCheckerWebpackPlugin",
    );
    if (forkTsPluginIndex !== -1) {
      // Stripped completely. Let your IDE, specialized CI lint tasks, or tsc handle it.
      options.plugins.splice(forkTsPluginIndex, 1);
    }
  }

  // 2. Replace ts-loader with ultra-fast swc-loader
  if (options.module && options.module.rules) {
    options.module.rules = options.module.rules.map(rule => {
      const isTsLoader =
        rule.loader?.includes("ts-loader") ||
        (Array.isArray(rule.use) &&
          rule.use.some(u => (u.loader || u).includes("ts-loader")));
      if (isTsLoader) {
        return {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "swc-loader",
            options: {
              jsc: {
                target: "es2022",
                parser: {
                  syntax: "typescript",
                  decorators: true,
                  dynamicImport: true,
                },
                transform: {
                  legacyDecorator: true,
                  decoratorMetadata: true,
                },
                keepClassNames: true,
              },
            },
          },
        };
      }
      return rule;
    });
  }

  return {
    ...options,

    // 3. Persistent Filesystem Caching
    cache: isDev
      ? {
          type: "filesystem",
          buildDependencies: { config: [__filename] },
          maxMemoryGenerations: 1,
        }
      : false, // Clean builds in CI/CD pipelines

    // 4. Drop heavy source maps in production to save build memory
    ...(isDev ? {} : { devtool: false }),

    // Cap concurrent module builds to bound peak memory
    parallelism: Number(process.env.WEBPACK_PARALLELISM ?? 1),

    externals: [
      nodeExternals({
        allowlist: [/^@repo/, "server-only"],
        modulesDir: path.resolve(__dirname, "node_modules"),
      }),
      "sharp",
      "qrcode",
    ],

    resolve: {
      ...options.resolve,
      extensionAlias: options.resolve?.extensionAlias || {
        ".js": [".ts", ".js"],
      },
      alias: {
        ...options.resolve?.alias,
        "@": SRC_DIR,
        "server-only": EMPTY_MODULE,
      },
      // 5. Restrict module scanning to slash I/O overhead
      modules: [SRC_DIR, "node_modules"],
    },

    performance: {
      hints: false,
    },

    stats: "errors-warnings",
    infrastructureLogging: { level: "error" },

    // 6. Disable heavy frontend-centric chunk optimization for Node bundle
    optimization: {
      ...options.optimization,
      splitChunks: false,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      minimize: false, // Minification on massive backend bundles spikes memory
    },
  };
};
