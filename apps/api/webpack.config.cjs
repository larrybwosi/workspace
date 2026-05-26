const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = function (options) {
  // 1. Filter out the default NestJS ts-loader rule
  const rules = options.module?.rules?.filter(rule => {
    if (typeof rule === 'string') return true;
    const use = rule.use;
    if (Array.isArray(use)) {
      return !use.some(u => (typeof u === 'object' && u.loader === 'ts-loader') || u === 'ts-loader');
    }
    if (typeof use === 'object') {
      return use.loader !== 'ts-loader';
    }
    return use !== 'ts-loader';
  }) || [];

  // 2. Add your custom SWC loader rule
  rules.push({
    test: /\.ts$/,
    exclude: [/node_modules/, /\.spec\.ts$/],
    use: {
      loader: 'swc-loader',
      options: {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'esnext',
          externalHelpers: false,
          keepClassNames: true,
        },
        module: {
          type: 'es6',
        },
      },
    },
  });

  return {
    ...options,
    externals: [
      nodeExternals({
        importType: 'module',
        // CRITICAL FOR MONOREPOS: Tell Webpack TO bundle your internal packages
        // Also bundle @fastify/multipart to avoid resolution errors in some environments
        allowlist: [/^@repo\//, '@fastify/multipart'],
      }),
    ],
    experiments: {
      ...options.experiments,
      outputModule: true,
    },
    output: {
      ...options.output,
      module: true,
      filename: '[name].js',
      chunkFormat: 'module',
      library: {
        type: 'module',
      },
    },
    resolve: {
      ...options.resolve,
      plugins: [
        ...(options.resolve?.plugins || []),
        new TsconfigPathsPlugin({
          configFile: './tsconfig.json',
        }),
      ],
    },
    module: {
      ...options.module,
      rules,
    },
  };
};
