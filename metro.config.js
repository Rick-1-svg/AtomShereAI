const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure for Expo Go compatibility
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;