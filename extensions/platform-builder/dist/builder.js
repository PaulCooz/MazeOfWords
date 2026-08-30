"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = exports.unload = exports.load = void 0;
const global_1 = require("./global");
const load = function () {
    console.debug(`${global_1.PACKAGE_NAME} builder load`);
};
exports.load = load;
const unload = function () {
    console.debug(`${global_1.PACKAGE_NAME} builder unload`);
};
exports.unload = unload;
exports.configs = {
    'web-mobile': {
        hooks: './hooks',
        options: {
            target: {
                label: 'Platform target',
                description: 'Set automatically by Build menu commands from platforms.json.',
                default: '',
                hidden: true,
                render: {
                    ui: 'ui-input',
                },
            },
        },
    },
};
