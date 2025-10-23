const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)
// Allow .wasm files to be bundled correctly
config.resolver.assetExts.push('wasm');

module.exports = config;

module.exports = withNativeWind(config, { input: './global.css' })