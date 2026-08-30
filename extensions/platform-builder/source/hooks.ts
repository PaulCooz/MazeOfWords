import { basename } from 'path';
import { BuildHook } from '../@types';
import { applyPlatformTemplate } from './apply-template';
import { error, log, resolveTarget } from './global';

export const throwError: BuildHook.throwError = true;

export const load: BuildHook.load = async function () {
    log('Build hooks loaded.');
};

export const unload: BuildHook.unload = async function () {};

export const onBeforeBuild: BuildHook.onBeforeBuild = async function (options) {
    const target = resolveTarget(options);
    if (!target) {
        return;
    }
    log(`Building ${target.label} as web-mobile → build/${target.output}/`);
};

export const onAfterBuild: BuildHook.onAfterBuild = async function (options, result) {
    const target = resolveTarget(options);
    if (!target) {
        return;
    }

    const dest = result.dest || result.paths.output || result.paths.dir;
    if (!dest) {
        throw new Error(`${target.label}: build output directory is missing.`);
    }

    log(`Applying ${target.id} template in ${dest}`);
    const projectName = options.name || basename(Editor.Project.path);
    applyPlatformTemplate(target, dest, projectName);
    log(`${target.label} template applied. Output: ${dest}`);
};

export const onError: BuildHook.onError = async function (options) {
    const target = resolveTarget(options);
    if (!target) {
        return;
    }
    error(`${target.label} build reported an error.`);
};
