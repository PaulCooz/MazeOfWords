import { BuildPlugin } from '../@types';
import { PACKAGE_NAME } from './global';

export const load: BuildPlugin.load = function () {
    console.debug(`${PACKAGE_NAME} builder load`);
};

export const unload: BuildPlugin.load = function () {
    console.debug(`${PACKAGE_NAME} builder unload`);
};

export const configs: BuildPlugin.Configs = {
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
