const {
    override,
    overrideDevServer,
    fixBabelImports,
    addLessLoader,
    addWebpackAlias,
  } = require("customize-cra");
  const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
  const path = require("path");
  function resolve(dir) {
    return path.join(__dirname, dir);
  }
  process.env.CI = "false";
  const addCustomize = () => (config) => {
    if (config.resolve) {
      config.resolve.extensions.push(".jsx");
    }
    return config;
  };
  const addProxy = () => (configFunction) => {
    configFunction.proxy = {
      '/rest/pc': {
        target: 'http://172.16.139.59:8086',
        pathRewrite: {},
        secure: false,
        changeOrigin: true,
      }
    }
  
    return configFunction
  }
  const getStyleLoaders = (cssOptions, preProcessor, lessOptions) => { // 这个是use里要设置的，封装了下
    const loaders = [
      require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: cssOptions
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          // Necessary for external CSS imports to work
          // https://github.com/facebook/create-react-app/issues/2677
          ident: 'postcss',
          plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009'
              },
              stage: 3
            })
          ]
        }
      }
    ];
    if (preProcessor) {
      loaders.push({
        loader: require.resolve(preProcessor),
        options: lessOptions
      });
    }
    return loaders;
  };
  /**
   * @param target: 要遍历的对象
   * @param name: 插件名
   * @param callback: 回调函数，第一个参数为该插件对象
   * @return null
   */
   function invade(target, name, callback) {
    target.forEach(
      item => {
        if (item.constructor.name === name) {
          callback(item)
        }
      }
    )
  }
  
  module.exports = {
    webpack: override(
      // 针对antd实现按需打包: 根据import来打包(使用babel-plugin-import)
      fixBabelImports("import", {
        libraryName: "antd",
        libraryDirectory: "es",
        style: true, // 自动打包相关的样式
      },{
        libraryName: "lodash",
        libraryDirectory: "es",
        style: true, // 自动打包相关的样式
      }),
    
      // 使用less-loader对源码中的less的变量进行重新指定
      addLessLoader({
        javascriptEnabled: true,
        modifyVars: { "@primary-color": "#1DA57A" },
      }),
    
      // 配置路径别名
      addWebpackAlias({
        "@": resolve("src"),
      }),
      addCustomize(),
     config => {
      if (process.env.NODE_ENV === "production") {
        config.devtool = false;
        invade(config.optimization.minimizer, 'TerserPlugin', (e) => {
          // 去除 LICENSE.txt
          e.options.extractComments = false
          // 去除生产环境 console.log
          e.options.terserOptions.compress.drop_console = true
        })
        invade(config.plugins, 'MiniCssExtractPlugin', (e) => {
          e.options.chunkFilename = e.options.chunkFilename.replace('.chunk', '')
        })
        // config.optimization.splitChunks = {
        //   chunks: 'all',
        //   cacheGroups: {
        //     libs: {
        //       name: 'chunk-libs',
        //       test: /[\\/]node_modules[\\/]/,
        //       priority: 10,
        //       chunks: 'initial' // only package third parties that are initially dependent
        //     },
        //     commons: {
        //       name: 'chunk-commons',
        //       test: resolve('src/components'), // can customize your rules
        //       minChunks: 3, //  minimum common number
        //       priority: 5,
        //       reuseExistingChunk: true
        //     }
        //   }
        // }
      }
      const oneOf_loc= config.module.rules.findIndex(n=>n.oneOf) // 这里的config是全局的
      config.module.rules[oneOf_loc].oneOf=[
        {
          test: /\.module\.less$/,
          use: getStyleLoaders(
            {
              importLoaders: 2,
              modules: {
                getLocalIdent: getCSSModuleLocalIdent
              }
            },
            'less-loader'
          ).concat(
            {
              loader: 'style-resources-loader',
              options: {
                patterns: [
                  path.resolve(__dirname, './src/styles/variable.less'),
                ],
              }
            },
          )
        },
        ...config.module.rules[oneOf_loc].oneOf
      ]
    
      return config
     }
    ),
    devServer: overrideDevServer(addProxy())
  }
  