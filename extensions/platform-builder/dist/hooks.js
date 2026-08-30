"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onError = exports.onAfterBuild = exports.onBeforeBuild = exports.unload = exports.load = exports.throwError = void 0;
const path_1 = require("path");
const apply_template_1 = require("./apply-template");
const global_1 = require("./global");
exports.throwError = true;
const load = async function () {
    (0, global_1.log)('Build hooks loaded.');
};
exports.load = load;
const unload = async function () { };
exports.unload = unload;
const onBeforeBuild = async function (options) {
    const target = (0, global_1.resolveTarget)(options);
    if (!target) {
        return;
    }
    const dest = (0, apply_template_1.emptyPlatformOutput)(options, target);
    (0, global_1.log)(`Cleared ${dest}`);
    (0, global_1.log)(`Building ${target.label} as web-mobile → build/${target.output}/`);
};
exports.onBeforeBuild = onBeforeBuild;
const onAfterBuild = async function (options, result) {
    const target = (0, global_1.resolveTarget)(options);
    if (!target) {
        return;
    }
    const dest = result.dest || result.paths.output || result.paths.dir;
    if (!dest) {
        throw new Error(`${target.label}: build output directory is missing.`);
    }
    (0, global_1.log)(`Applying ${target.id} template in ${dest}`);
    const projectName = options.name || (0, path_1.basename)(Editor.Project.path);
    (0, apply_template_1.applyPlatformTemplate)(target, dest, projectName);
    (0, global_1.log)(`${target.label} template applied. Output: ${dest}`);
};
exports.onAfterBuild = onAfterBuild;
const onError = async function (options) {
    const target = (0, global_1.resolveTarget)(options);
    if (!target) {
        return;
    }
    (0, global_1.error)(`${target.label} build reported an error.`);
};
exports.onError = onError;
