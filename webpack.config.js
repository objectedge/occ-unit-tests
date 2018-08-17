const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

const entries = {};
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');
const plugins = [];
const occComponentsTempDir = path.join(__dirname, 'occ-components', 'widgets');

//Set occ-components path
plugins.push(new webpack.NormalModuleReplacementPlugin(/occ-components/, (moduleObject) => {
  const moduleName = moduleObject.request.replace('occ-components/', '');
  const entryPoint = 'index.js';
  
  moduleObject.request = path.join(occComponentsTempDir, moduleName, entryPoint);
}));

const srcFilesList = glob.sync(path.join(srcDir, '**', '*.js'));
srcFilesList.forEach(srcPath => {
  entries[path.relative(srcDir, srcPath)] = srcPath;
});

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
