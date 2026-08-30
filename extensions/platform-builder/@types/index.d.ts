export * from '@cocos/creator-types/editor/packages/builder/@types/public';

import { IBuildTaskOption } from '@cocos/creator-types/editor/packages/builder/@types/public';

export interface IOptions {
    target?: string;
}

export interface ITaskOptions extends IBuildTaskOption {
    packages: {
        'platform-builder': IOptions;
    };
}
