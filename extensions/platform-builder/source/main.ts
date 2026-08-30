import { IBuildTaskOption } from '../@types';
import { error, log, methodName, PACKAGE_NAME, PlatformTarget, PLATFORMS, warn } from './global';

const BUILD_SUCCESS = 36;
const BUILD_INVALID_OPTIONS = 32;
const BUILD_UNEXPECTED = 34;

let building = false;

export const methods: { [key: string]: (...args: unknown[]) => unknown } = {};
for (const platform of PLATFORMS) {
    methods[methodName(platform)] = () => startBuild(platform);
}

export function load() {
    log(`Loaded. ${PLATFORMS.map((platform) => platform.label).join(', ')}`);
}

export function unload() {}

async function startBuild(target: PlatformTarget) {
    if (building) {
        warn('A platform build is already running.');
        return;
    }

    building = true;
    log(`Starting ${target.label} (web-mobile → build/${target.output}/)`);

    try {
        await Editor.Message.request('builder', 'open', 'default');
        const options = await makeBuildOptions(target);
        const result = await builderRequest('add-task', options, true);
        reportBuildResult(target, result);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        error(`${target.label} build failed:`, message);
        if (err instanceof Error && err.stack) {
            error(err.stack);
        }
    } finally {
        building = false;
    }
}

async function makeBuildOptions(target: PlatformTarget): Promise<Partial<IBuildTaskOption>> {
    const options: Partial<IBuildTaskOption> = {
        platform: 'web-mobile',
        outputName: target.output,
        taskName: target.output,
        buildPath: 'project://build',
        packages: {
            [PACKAGE_NAME]: { target: target.id },
        },
    };

    try {
        const info = await builderRequest('query-tasks-info', { type: 'build' }) as {
            list?: Array<{ id: string; options?: IBuildTaskOption }>;
        };
        const list = info?.list || [];
        const sameOutput = list.find((task) => task.options?.outputName === target.output);
        const webMobile = list.find((task) => task.options?.platform === 'web-mobile');
        const base = sameOutput?.options || webMobile?.options;

        if (base) {
            copyDefined(options, base, [
                'debug',
                'md5Cache',
                'sourceMaps',
                'skipCompressTexture',
                'startScene',
                'scenes',
                'name',
                'mainBundleCompressionType',
                'nativeCodeBundleMode',
                'useSplashScreen',
                'splashScreen',
                'overwriteProjectSettings',
                'experimentalEraseModules',
                'mangleProperties',
                'inlineEnum',
                'polyfills',
                'resolution',
            ]);
            if (base.buildPath) {
                options.buildPath = base.buildPath;
            }
            options.packages = Object.assign({}, base.packages, options.packages);
            if (sameOutput?.id) {
                options.id = sameOutput.id;
                options.taskId = sameOutput.id;
            }
        }
    } catch (err) {
        warn('Could not read existing build tasks, using defaults:', err instanceof Error ? err.message : err);
    }

    delete options.logDest;
    return options;
}

function builderRequest(message: string, ...args: unknown[]) {
    return (Editor.Message.request as (pkg: string, msg: string, ...rest: unknown[]) => Promise<unknown>)(
        'builder',
        message,
        ...args,
    );
}

function copyDefined(target: Partial<IBuildTaskOption>, source: IBuildTaskOption, keys: (keyof IBuildTaskOption)[]) {
    for (const key of keys) {
        if (source[key] !== undefined) {
            (target as Record<string, unknown>)[key as string] = source[key];
        }
    }
}

function reportBuildResult(target: PlatformTarget, result: unknown) {
    if (result === BUILD_SUCCESS || result === true) {
        log(`${target.label} build finished: build/${target.output}/`);
        return;
    }
    if (result === BUILD_INVALID_OPTIONS) {
        error(`${target.label} build failed: invalid build parameters.`);
        return;
    }
    if (result === BUILD_UNEXPECTED) {
        error(`${target.label} build failed: unexpected error. See the build log.`);
        return;
    }
    if (result && typeof result === 'object') {
        const state = (result as { state?: string; code?: number; message?: string }).state
            || (result as { code?: number }).code;
        if (state === 'success' || state === BUILD_SUCCESS) {
            log(`${target.label} build finished: build/${target.output}/`);
            return;
        }
        if (state === 'failure' || state === 'cancel') {
            error(`${target.label} build ${state}.`, (result as { message?: string }).message || '');
            return;
        }
    }
    log(`${target.label} build queued. Watch the Build panel and Console.`);
}
