import { readFileSync } from 'fs';
import { join } from 'path';

export const PACKAGE_NAME = 'platform-builder';

export interface PlatformTarget {
    id: string;
    label: string;
    output: string;
}

interface PlatformsConfig {
    menu: string;
    platforms: PlatformTarget[];
}

function loadConfig(): PlatformsConfig {
    const raw = readFileSync(join(__dirname, '..', 'platforms.json'), 'utf8');
    const config = JSON.parse(raw) as PlatformsConfig;
    if (!config.menu || !Array.isArray(config.platforms)) {
        throw new Error('platforms.json: expected { menu, platforms: [...] }');
    }
    return config;
}

const config = loadConfig();

export const MENU_PATH = config.menu;
export const PLATFORMS: PlatformTarget[] = config.platforms;

export function findPlatform(idOrOutput: string) {
    return PLATFORMS.find((platform) => platform.id === idOrOutput || platform.output === idOrOutput) || null;
}

export function methodName(platform: PlatformTarget) {
    return `build-${platform.id}`;
}

export function log(...args: unknown[]) {
    console.log('[Platform Builder]', ...args);
}

export function warn(...args: unknown[]) {
    console.warn('[Platform Builder]', ...args);
}

export function error(...args: unknown[]) {
    console.error('[Platform Builder]', ...args);
}

export function resolveTarget(options: { packages?: Record<string, { target?: string }>; outputName?: string }): PlatformTarget | null {
    const id = options.packages?.[PACKAGE_NAME]?.target;
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
