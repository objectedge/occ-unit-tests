const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const devConfigs = require('./dev-configs');

const entries = {};
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');
const plugins = [];
const occComponentsTempDir = path.join(__dirname, 'occ-components', 'widgets');

fs.removeSync(distDir);
fs.ensureDirSync(distDir);

//Set occ-components path
plugins.push(new webpack.NormalModuleReplacementPlugin(/occ-components/, (moduleObject) => {
  const moduleName = moduleObject.request.replace('occ-components/', '');
  const entryPoint = 'index.js';
  
  moduleObject.request = path.join(occComponentsTempDir, moduleName, entryPoint);
}));

let srcFilesList = [];

for(contentRelativePath of devConfigs.contents) {
  const files = glob.sync(path.join(srcDir, contentRelativePath, '**', '*.js'));
  if(files.length) {
    files.forEach(filePath => {
      srcFilesList.push(filePath);
    })
  }
}

srcFilesList.forEach(srcPath => {
  entries[path.relative(srcDir, srcPath)] = srcPath;
});

entries[path.join('widget-core', 'index.js')] = path.join('occ-components', 'widget-core');

module.exports = {
  entry: entries,
  output: {
    path: distDir,
    filename: '[name]',
    libraryTarget: "amd"
  },
  externals: [
    /^((\/file)|(?!\.{1}|occ-components|(.+:\\)|\/{1}[a-z-A-Z0-9_.]{1})).+?$/
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
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
  mode: 'production'
};
