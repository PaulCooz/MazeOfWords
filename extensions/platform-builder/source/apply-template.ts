import { copyFileSync, emptyDirSync, existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'fs-extra';
import { join, normalize } from 'path';
import { IBuildTaskOption } from '../@types';
import { PlatformTarget, PLATFORMS, warn } from './global';

export function emptyPlatformOutput(options: IBuildTaskOption, target: PlatformTarget) {
    const dest = resolveOutputDir(options, target);
    const expected = (options.outputName || target.output).replace(/[/\\]+$/, '');
    const tail = dest.split(/[/\\]/).filter(Boolean).pop();
    if (tail !== expected) {
        throw new Error(`Refusing to empty unexpected output dir: ${dest}`);
    }
    emptyDirSync(dest);
    return dest;
}

export function resolveOutputDir(options: IBuildTaskOption, target: PlatformTarget) {
    const outputName = options.outputName || target.output;
    const buildPath = options.buildPath || 'project://build';
    const root = resolveBuildRoot(buildPath);
    return normalize(join(root, outputName));
}

function resolveBuildRoot(buildPath: string) {
    if (buildPath.startsWith('project://')) {
        return join(Editor.Project.path, buildPath.slice('project://'.length));
    }
    return buildPath;
}

export function applyPlatformTemplate(target: PlatformTarget, dest: string, projectName: string) {
    const templateRoot = join(__dirname, '..', 'templates', target.output);
    const ejsPath = join(templateRoot, 'index.ejs');
    if (!existsSync(ejsPath)) {
        throw new Error(`${target.label}: template not found: ${ejsPath}`);
    }

    const builtIndexPath = join(dest, 'index.html');
    if (!existsSync(builtIndexPath)) {
        throw new Error(`${target.label}: built index.html not found in ${dest}`);
    }

    const builtHtml = readFileSync(builtIndexPath, 'utf8');
    const bootstrap = extractCocosBootstrap(builtHtml);
    const cssUrl = extractCssUrl(builtHtml);
    let html = readFileSync(ejsPath, 'utf8');
    html = html.replace(/<%= ?projectName ?%>/g, escapeHtml(projectName));
    html = html.replace(/<%= ?cssUrl ?%>/g, escapeHtml(cssUrl));
    html = html.replace(/<%-\s*include\(\s*cocosTemplate\s*,\s*\{\s*\}\s*\)\s*%>/, bootstrap);
    writeFileSync(builtIndexPath, html, 'utf8');

    copyExtraTemplateFiles(templateRoot, dest);
    removeOtherPlatformExtras(target, dest);
}

function listExtraFiles(templateRoot: string) {
    if (!existsSync(templateRoot)) {
        return [];
    }
    return readdirSync(templateRoot).filter((name) => {
        if (name === 'index.ejs' || name === 'index.html') {
            return false;
        }
        return statSync(join(templateRoot, name)).isFile();
    });
}

function extraFileNames(platform: PlatformTarget) {
    return listExtraFiles(join(__dirname, '..', 'templates', platform.output));
}

function copyExtraTemplateFiles(templateRoot: string, dest: string) {
    for (const name of listExtraFiles(templateRoot)) {
        copyFileSync(join(templateRoot, name), join(dest, name));
    }
}

function removeOtherPlatformExtras(current: PlatformTarget, dest: string) {
    const keep = new Set(extraFileNames(current));
    for (const platform of PLATFORMS) {
        if (platform.id === current.id) {
            continue;
        }
        for (const name of extraFileNames(platform)) {
            if (keep.has(name)) {
                continue;
            }
            const file = join(dest, name);
            if (existsSync(file)) {
                unlinkSync(file);
            }
        }
    }
}

export function extractCssUrl(html: string) {
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

export function extractCocosBootstrap(html: string) {
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
        warn('Could not skip both GameDiv wrappers; using remaining body content as engine bootstrap.');
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

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
