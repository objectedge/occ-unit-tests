const webpack = require('webpack');
const webpackConfigs = require('../webpack/webpack.config');
const webPackRunner = webpack(webpackConfigs);
const args = process.argv;
const watch = args[2] === '--watch';
const onBuild = (err, stats) => {
  console.log('[bundler:compile] %s', stats.toString({
    chunks: true, // Makes the build much quieter
    colors: true
  }));
};

if(watch) {
  webPackRunner.watch({}, onBuild);
} else {
  webPackRunner.run(onBuild);
}
