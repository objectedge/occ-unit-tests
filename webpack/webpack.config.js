const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const configs = require('../configs');
const applicationPath = configs.application.basePath;
const rootPath = path.join(__dirname, '..');

const entries = {};
const destDir = configs.webpackDataDir;
const plugins = [];
const occComponentsTempDir = path.join(rootPath, 'occ-components', 'widgets');
const widgetCoreDir = path.join('occ-components', 'widget-core');

fs.removeSync(destDir);
fs.ensureDirSync(destDir);

//Set occ-components path
plugins.push(new webpack.NormalModuleReplacementPlugin(/occ-components/, (moduleObject) => {
  const moduleName = moduleObject.request.replace('occ-components/', '');
  const entryPoint = 'index.js';

  moduleObject.request = path.join(occComponentsTempDir, moduleName, entryPoint);
}));

plugins.push(new MiniCssExtractPlugin());

const includes = [];

for(contentRelativePath of configs.src) {
  const files = glob.sync(path.join(applicationPath, contentRelativePath, '@(js|less)', '**', '*.@(js|less)'));
  const absolutePath = path.join(applicationPath, contentRelativePath);

  if(files.length) {
    includes.push(path.join(applicationPath, contentRelativePath));
    files.forEach(filePath => {
      let destFileName = path.join(contentRelativePath, path.relative(absolutePath, filePath));

      if(/\.less/.test(destFileName)) {
        destFileName = destFileName.replace('.less', '');
      }

      entries[destFileName] = filePath;
      plugins.push(new webpack.PrefetchPlugin(path.dirname(filePath), widgetCoreDir));
    })
  }
}

includes.push(occComponentsTempDir);
entries[path.join('widget-core', 'index.js')] = widgetCoreDir;

module.exports = {
  entry: entries,
  output: {
    path: destDir,
    filename: '[name]',
    libraryTarget: "amd"
  },
  externals: [
    /^((\/file)|(?!\.{1}|occ-components|(.+:\\)|\/{1}[a-z-A-Z0-9_.]{1})).+?$/
  ],
  module: {
    rules: [
      {
        test: /\.(less|css)$/,
        include: includes,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "less-loader",
            options: {
              cacheDirectory: true
            }
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        include: includes,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              require('babel-plugin-transform-decorators-legacy'),
              require('babel-plugin-transform-class-properties')
            ],
            cacheDirectory: true
          }
        }
      }
    ]
  },
  devtool: '#source-map',
  plugins: plugins,
  mode: 'development'
};
