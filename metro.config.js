const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const emptyModulePath = path.resolve(__dirname, 'node_modules/metro-runtime/src/modules/empty-module.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (typeof moduleName === 'string' && moduleName.includes('empty-module.js')) {
    return {
      type: 'sourceFile',
      filePath: emptyModulePath,
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
