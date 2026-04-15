const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Required for Drizzle migrations — allows importing .sql files
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, { input: './global.css' });
