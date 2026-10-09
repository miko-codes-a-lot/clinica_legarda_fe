module.exports = (config) => {
  config.set({
    frameworks: ['jasmine'],
    plugins: [require('karma-jasmine'), require('karma-chrome-launcher')],
    reporters: ['progress'],
    browsers: ['ChromeHeadlessIsolated'],
    customLaunchers: {
      ChromeHeadlessIsolated: {
        base: 'ChromeHeadless',
        // Karma creates a disposable profile. Tests never need the user's
        // macOS login keychain or permission to access its saved credentials.
        flags: process.platform === 'darwin' ? ['--use-mock-keychain'] : [],
      },
    },
  });
};
