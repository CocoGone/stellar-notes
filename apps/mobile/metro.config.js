const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// 仓库未使用 npm workspaces；共享的纯 TypeScript 代码位于 App 目录之外。
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../../shared')];

module.exports = config;
