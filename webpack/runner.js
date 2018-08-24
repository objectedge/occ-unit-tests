const webpack = require('webpack');
const webpackConfigs = require('../webpack/webpack.config');
const webPackRunner = webpack(webpackConfigs);

module.exports = function (watch) {
  let started = false;
  let webpackInstance;

  return new Promise(resolve => {
    const onBuild = (err, stats) => {
      if(!started) {
        resolve(() => {
          if(webpackInstance) {
            webpackInstance.close();
          }
        });
      }

      started = true;
      if(err) {
        console.log(stats.toString({
          chunks: true, // Makes the build much quieter
          colors: true
        }));
        return;
      }

      console.log('running webpack...');
    };

    if(watch) {
      webpackInstance = webPackRunner.watch({}, onBuild);
    } else {
      webpackInstance = webPackRunner.run(onBuild);
    }
  });
};
