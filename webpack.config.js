const path = require('path');
const webpack = require('webpack');

module.exports = (env) => {
  const isProduction = env.NODE_ENV === 'production';
  const isPackaging = env.package === 'true';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.ts',
    target: 'node',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isPackaging ? 'bundle.js' : 'index.js',
      libraryTarget: 'commonjs2',
      clean: true
    },

    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json'
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.json$/,
          type: 'json'
        }
      ]
    },

    externals: {
      // Keep these as external dependencies for the .dxt bundle
      'sharp': 'commonjs sharp',
      'tesseract.js': 'commonjs tesseract.js',
      'pdf-parse': 'commonjs pdf-parse',
      'fs-extra': 'commonjs fs-extra',
      'crypto': 'commonjs crypto',
      'os': 'commonjs os',
      'path': 'commonjs path',
      'fs': 'commonjs fs'
    },

    optimization: {
      minimize: isProduction,
      // Don't minimize for better debugging in development
      minimizer: isProduction ? [] : []
    },

    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.VERSION': JSON.stringify(require('./package.json').version)
      }),
      
      // Provide polyfills for Node.js globals
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      }),

      // Banner with shebang for CLI usage
      new webpack.BannerPlugin({
        banner: '#!/usr/bin/env node',
        raw: true,
        entryOnly: true
      })
    ],

    devtool: isProduction ? 'source-map' : 'inline-source-map',
    
    // Optimization for i3-12100F + 16GB
    performance: {
      maxEntrypointSize: 10 * 1024 * 1024, // 10MB
      maxAssetSize: 10 * 1024 * 1024,      // 10MB
      hints: isProduction ? 'warning' : false
    },

    stats: {
      colors: true,
      modules: false,
      chunks: false,
      chunkModules: false
    },

    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 1000
    }
  };
};