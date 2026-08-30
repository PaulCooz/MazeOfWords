"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyPlatformOutput = emptyPlatformOutput;
exports.resolveOutputDir = resolveOutputDir;
exports.applyPlatformTemplate = applyPlatformTemplate;
exports.extractCssUrl = extractCssUrl;
exports.extractCocosBootstrap = extractCocosBootstrap;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const global_1 = require("./global");
function emptyPlatformOutput(options, target) {
    const dest = resolveOutputDir(options, target);
    const expected = (options.outputName || target.output).replace(/[/\\]+$/, '');
    const tail = dest.split(/[/\\]/).filter(Boolean).pop();
    if (tail !== expected) {
        throw new Error(`Refusing to empty unexpected output dir: ${dest}`);
    }
    (0, fs_extra_1.emptyDirSync)(dest);
    return dest;
}
function resolveOutputDir(options, target) {
    const outputName = options.outputName || target.output;
    const buildPath = options.buildPath || 'project://build';
    const root = resolveBuildRoot(buildPath);
    return (0, path_1.normalize)((0, path_1.join)(root, outputName));
}
function resolveBuildRoot(buildPath) {
    if (buildPath.startsWith('project://')) {
        return (0, path_1.join)(Editor.Project.path, buildPath.slice('project://'.length));
    }
    return buildPath;
}
function applyPlatformTemplate(target, dest, projectName) {
    const templateRoot = (0, path_1.join)(__dirname, '..', 'templates', target.output);
    const ejsPath = (0, path_1.join)(templateRoot, 'index.ejs');
    if (!(0, fs_extra_1.existsSync)(ejsPath)) {
        throw new Error(`${target.label}: template not found: ${ejsPath}`);
    }
    const builtIndexPath = (0, path_1.join)(dest, 'index.html');
    if (!(0, fs_extra_1.existsSync)(builtIndexPath)) {
        throw new Error(`${target.label}: built index.html not found in ${dest}`);
    }
    const builtHtml = (0, fs_extra_1.readFileSync)(builtIndexPath, 'utf8');
    const bootstrap = extractCocosBootstrap(builtHtml);
    const cssUrl = extractCssUrl(builtHtml);
    let html = (0, fs_extra_1.readFileSync)(ejsPath, 'utf8');
    html = html.replace(/<%= ?projectName ?%>/g, escapeHtml(projectName));
    html = html.replace(/<%= ?cssUrl ?%>/g, escapeHtml(cssUrl));
    html = html.replace(/<%-\s*include\(\s*cocosTemplate\s*,\s*\{\s*\}\s*\)\s*%>/, bootstrap);
    (0, fs_extra_1.writeFileSync)(builtIndexPath, html, 'utf8');
    copyExtraTemplateFiles(templateRoot, dest);
    removeOtherPlatformExtras(target, dest);
}
function listExtraFiles(templateRoot) {
    if (!(0, fs_extra_1.existsSync)(templateRoot)) {
        return [];
    }
    return (0, fs_extra_1.readdirSync)(templateRoot).filter((name) => {
        if (name === 'index.ejs' || name === 'index.html') {
            return false;
        }
        return (0, fs_extra_1.statSync)((0, path_1.join)(templateRoot, name)).isFile();
    });
}
function extraFileNames(platform) {
    return listExtraFiles((0, path_1.join)(__dirname, '..', 'templates', platform.output));
}
function copyExtraTemplateFiles(templateRoot, dest) {
    for (const name of listExtraFiles(templateRoot)) {
        (0, fs_extra_1.copyFileSync)((0, path_1.join)(templateRoot, name), (0, path_1.join)(dest, name));
    }
}
function removeOtherPlatformExtras(current, dest) {
    const keep = new Set(extraFileNames(current));
    for (const platform of global_1.PLATFORMS) {
        if (platform.id === current.id) {
            continue;
        }
        for (const name of extraFileNames(platform)) {
            if (keep.has(name)) {
                continue;
            }
            const file = (0, path_1.join)(dest, name);
            if ((0, fs_extra_1.existsSync)(file)) {
                (0, fs_extra_1.unlinkSync)(file);
            }
        }
    }
}
function extractCssUrl(html) {
    const tags = html.match(/<link\b[^>]*>/gi) || [];
    for (const tag of tags) {
        if (!/\brel=["']stylesheet["']/i.test(tag)) {
            continue;
        }
        const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
        if (href) {
            return href;
        }
    }
    throw new Error('Built index.html is missing stylesheet href.');
}
function extractCocosBootstrap(html) {
    const canvasClose = html.search(/<\/canvas>/i);
    if (canvasClose < 0) {
        throw new Error('Built index.html is missing <canvas id="GameCanvas">.');
    }
    let i = canvasClose + '</canvas>'.length;
    let skipped = 0;
    while (skipped < 2) {
        const match = html.slice(i).match(/^\s*<\/div>/i);
        if (!match) {
            break;
        }
        i += match[0].length;
        skipped += 1;
    }
    if (skipped < 2) {
        (0, global_1.warn)('Could not skip both GameDiv wrappers; using remaining body content as engine bootstrap.');
    }
    const rest = html.slice(i);
    const bodyClose = rest.search(/<\/body>/i);
    if (bodyClose < 0) {
        throw new Error('Built index.html is missing </body>.');
    }
    const bootstrap = rest.slice(0, bodyClose).trim();
    if (!bootstrap) {
        throw new Error('Failed to extract engine bootstrap from built index.html.');
    }
    return bootstrap;
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
