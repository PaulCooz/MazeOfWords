"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORMS = exports.MENU_PATH = exports.PACKAGE_NAME = void 0;
exports.findPlatform = findPlatform;
exports.methodName = methodName;
exports.log = log;
exports.warn = warn;
exports.error = error;
exports.resolveTarget = resolveTarget;
const fs_1 = require("fs");
const path_1 = require("path");
exports.PACKAGE_NAME = 'platform-builder';
function loadConfig() {
    const raw = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '..', 'platforms.json'), 'utf8');
    const config = JSON.parse(raw);
    if (!config.menu || !Array.isArray(config.platforms)) {
        throw new Error('platforms.json: expected { menu, platforms: [...] }');
    }
    return config;
}
const config = loadConfig();
exports.MENU_PATH = config.menu;
exports.PLATFORMS = config.platforms;
function findPlatform(idOrOutput) {
    return exports.PLATFORMS.find((platform) => platform.id === idOrOutput || platform.output === idOrOutput) || null;
}
function methodName(platform) {
    return `build-${platform.id}`;
}
function log(...args) {
    console.log('[Platform Builder]', ...args);
}
function warn(...args) {
    console.warn('[Platform Builder]', ...args);
}
function error(...args) {
    console.error('[Platform Builder]', ...args);
}
function resolveTarget(options) {
    const id = options.packages?.[exports.PACKAGE_NAME]?.target;
    if (id) {
        const byId = findPlatform(id);
        if (byId) {
            return byId;
        }
    }
    if (options.outputName) {
        return findPlatform(options.outputName);
    }
    return null;
}
