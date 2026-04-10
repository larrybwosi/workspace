const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = function (options) {
  return {
    ...options,
    externals: [
      nodeExternals({
        importType: 'module',
      }),
    ],
    experiments: {
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
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
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
                externalHelpers: true,
                keepClassNames: true,
              },
              module: {
                type: 'es6',
              },
            },
          },
        },
      ],
    },
  };
};
