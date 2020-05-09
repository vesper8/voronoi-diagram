const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { VueLoaderPlugin } = require('vue-loader')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const PreloadPlugin = require('preload-webpack-plugin')
const HardSourcePlugin = require('hard-source-webpack-plugin')

module.exports = (env, options) => {
  const { mode } = options
  const isDev = mode !== 'production'
  const isReportEnabled = options.report !== undefined

  const cssModuleLoader = {
    loader: 'css-loader',
    options: {
      modules: {
        localIdentName: isDev ? '[name]_[local]_[hash:base64:2]' : '[hash:base64:8]',
      },
    },
  }

  const sassLoader = {
    loader: 'sass-loader',
    options: {
      prependData: `@import "${path.resolve(__dirname, './assets/styles/variables.scss').replace(/\\/g, '/')}";`,
    },
  }

  const config = {
    entry: {
      main: [
        '@babel/polyfill',
        path.resolve(__dirname, './src/main.js'),
      ],
    },
    output: {
      path: path.resolve(__dirname, './dist/'),
      filename: `js/bundle.[hash].js`,
      publicPath: isDev ? '/' : '',
    },
    resolve: {
      extensions: ['*', '.js', '.vue', '.scss', '.css'],
      modules: ['node_modules', 'js'],
      alias: {
        // https://github.com/vuejs/vue-next-webpack-preview/blob/master/webpack.config.js#L13
        'vue': '@vue/runtime-dom',
      },
    },
    devtool: isDev ? 'source-map' : 'none',
    plugins: [
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false,
        dry: false,
        cleanOnceBeforeBuildPatterns: ['js/*', 'assets/*'],
        cleanAfterEveryBuildPatterns: ['js/*', 'assets/*'],
      }),
      new VueLoaderPlugin(),
      new HardSourcePlugin(),
      new CaseSensitivePathsPlugin(),
    ],
    module: {
      rules: [
        {
          test: /\.svg$/,
          loader: 'svg-inline-loader',
        },
        {
          test: /\.(png|jpe?g|gif|woff(2)?|ttf|eot)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                // https://stackoverflow.com/questions/59070216/webpack-file-loader-outputs-object-module
                esModule: false,
                limit: 1000,
                name: '[path]/[name].[hash:8].[ext]',
              },
            },
          ],
        },
        {
          test: /\.scss$/,
          oneOf: [
            {
              resourceQuery: /module/,
              use: ['vue-style-loader', cssModuleLoader, sassLoader],
            },
            {
              use: ['vue-style-loader', 'css-loader', 'postcss-loader', sassLoader],
            },
          ],
        },
        {
          test: /\.css$/,
          oneOf: [
            {
              resourceQuery: /module/,
              use: ['vue-style-loader', cssModuleLoader, 'postcss-loader'],
            },
            {
              use: ['vue-style-loader', 'css-loader', 'postcss-loader'],
            },
          ],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
        {
          test: /\.vue$/,
          exclude: /node_modules/,
          use: ['vue-loader'],
        },
      ],
    },
    devServer: {
      hot: true,
      inline: true,
      historyApiFallback: true,
      contentBase: './',
      watchContentBase: true,
      disableHostCheck: true,
    },
    stats: 'minimal',
  }

  if (isReportEnabled) {
    config.plugins.push(new BundleAnalyzerPlugin())
  }

  config.plugins.push(
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: './index.html',
      inject: true,
    })
  )
  config.plugins.push(new PreloadPlugin())

  return config
}
