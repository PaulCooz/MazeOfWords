"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const global_1 = require("./global");
const BUILD_SUCCESS = 36;
const BUILD_INVALID_OPTIONS = 32;
const BUILD_UNEXPECTED = 34;
let building = false;
exports.methods = {};
for (const platform of global_1.PLATFORMS) {
    exports.methods[(0, global_1.methodName)(platform)] = () => startBuild(platform);
}
function load() {
    (0, global_1.log)(`Loaded. ${global_1.PLATFORMS.map((platform) => platform.label).join(', ')}`);
}
function unload() { }
async function startBuild(target) {
    if (building) {
        (0, global_1.warn)('A platform build is already running.');
        return;
    }
    building = true;
    (0, global_1.log)(`Starting ${target.label} (web-mobile → build/${target.output}/)`);
    try {
        await Editor.Message.request('builder', 'open', 'default');
        const options = await makeBuildOptions(target);
        const result = await builderRequest('add-task', options, true);
        reportBuildResult(target, result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        (0, global_1.error)(`${target.label} build failed:`, message);
        if (err instanceof Error && err.stack) {
            (0, global_1.error)(err.stack);
        }
    }
    finally {
        building = false;
    }
}
async function makeBuildOptions(target) {
    const options = {
        platform: 'web-mobile',
        outputName: target.output,
        taskName: target.output,
        buildPath: 'project://build',
        packages: {
            [global_1.PACKAGE_NAME]: { target: target.id },
        },
    };
    try {
        const info = await builderRequest('query-tasks-info', { type: 'build' });
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
    }
    catch (err) {
        (0, global_1.warn)('Could not read existing build tasks, using defaults:', err instanceof Error ? err.message : err);
    }
    delete options.logDest;
    return options;
}
function builderRequest(message, ...args) {
    return Editor.Message.request('builder', message, ...args);
}
function copyDefined(target, source, keys) {
    for (const key of keys) {
        if (source[key] !== undefined) {
            target[key] = source[key];
        }
    }
}
function reportBuildResult(target, result) {
    if (result === BUILD_SUCCESS || result === true) {
        (0, global_1.log)(`${target.label} build finished: build/${target.output}/`);
        return;
    }
    if (result === BUILD_INVALID_OPTIONS) {
        (0, global_1.error)(`${target.label} build failed: invalid build parameters.`);
        return;
    }
    if (result === BUILD_UNEXPECTED) {
        (0, global_1.error)(`${target.label} build failed: unexpected error. See the build log.`);
        return;
    }
    if (result && typeof result === 'object') {
        const state = result.state
            || result.code;
        if (state === 'success' || state === BUILD_SUCCESS) {
            (0, global_1.log)(`${target.label} build finished: build/${target.output}/`);
            return;
        }
        if (state === 'failure' || state === 'cancel') {
            (0, global_1.error)(`${target.label} build ${state}.`, result.message || '');
            return;
        }
    }
    (0, global_1.log)(`${target.label} build queued. Watch the Build panel and Console.`);
}
