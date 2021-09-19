module.exports = {
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'SOTA Activation Zone Estimator - N6ARA';
      return args;
    });
  }
};
