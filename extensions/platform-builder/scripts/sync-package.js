'use strict';

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const config = JSON.parse(readFileSync(join(root, 'platforms.json'), 'utf8'));
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

if (!config.menu || !Array.isArray(config.platforms) || config.platforms.length === 0) {
    throw new Error('platforms.json: expected { menu, platforms: [...] }');
}

const ids = new Set();
const outputs = new Set();
for (const platform of config.platforms) {
    if (!platform.id || !platform.label || !platform.output) {
        throw new Error('platforms.json: each platform needs id, label, output');
    }
    if (ids.has(platform.id) || outputs.has(platform.output)) {
        throw new Error(`platforms.json: duplicate id or output "${platform.id}" / "${platform.output}"`);
    }
    ids.add(platform.id);
    outputs.add(platform.output);
}

pkg.contributions = pkg.contributions || {};
pkg.contributions.menu = config.platforms.map((platform) => ({
    path: config.menu,
    label: platform.label,
    message: `build-${platform.id}`,
}));
pkg.contributions.messages = {};
for (const platform of config.platforms) {
    pkg.contributions.messages[`build-${platform.id}`] = {
        methods: [`build-${platform.id}`],
    };
}

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`);
console.log(`Synced ${config.platforms.length} platform(s) into package.json`);
