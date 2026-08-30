"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPlatformTemplate = applyPlatformTemplate;
exports.extractCocosBootstrap = extractCocosBootstrap;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const global_1 = require("./global");
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
    const bootstrap = extractCocosBootstrap((0, fs_extra_1.readFileSync)(builtIndexPath, 'utf8'));
    let html = (0, fs_extra_1.readFileSync)(ejsPath, 'utf8');
    html = html.replace(/<%= ?projectName ?%>/g, escapeHtml(projectName));
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
