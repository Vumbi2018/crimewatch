const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude native Android and iOS folders from file watcher to prevent watch crashes during compilation
config.resolver.blockList = [
  /.*\/android\/.*/,
  /.*\/ios\/.*/,
];

module.exports = config;
