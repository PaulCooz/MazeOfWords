# Platform Builder

Cocos Creator 3.8.8 extension. Adds **Build** menu commands that package the project as `web-mobile` for a store platform, each with its own HTML shell and output folder.

The ordinary **Project → Build** workflow is unchanged.

## Platforms

Configured in [`platforms.json`](platforms.json). That file is the only list to edit when adding or removing a store target.

| id | Menu | Output | Template | SDK |
| --- | --- | --- | --- | --- |
| `YG` | Build → Yandex Games | `build/yandex/` | `templates/yandex/` | Yandex Games (`/sdk.js`, `Platform = "YG"`) |
| `CG` | Build → Crazy Games | `build/crazygames/` | `templates/crazygames/` | CrazyGames (`crazygames-sdk-v3.js`, `Platform = "CG"`) |

Each entry in `platforms.json`:

- `id` — command key (`build-<id>`) and the value written into the build as the platform target
- `label` — text in the **Build** menu
- `output` — both `build/<output>/` and `templates/<output>/`

`menu` is the top-level Editor menu name (`Build`).

## Use

1. Enable **platform-builder** in **Extension → Extension Manager → Project**.
2. **Build → Yandex Games** or **Build → Crazy Games**.
3. Watch Console for `[Platform Builder]` start / finish / error lines.

Repeat builds overwrite the same output folder.

## Add a platform

1. Append an object to `platforms` in `platforms.json`.
2. Add `templates/<output>/index.ejs` (and any extra files that should be copied into the package, e.g. `local-run.sh`).
3. From this folder:

```bash
npm install
npm run build
```

4. Reload the extension in Extension Manager.

`npm run build` copies the platform list into `package.json` (menu + messages) and compiles `source/` to `dist/`.

## Remove a platform

1. Delete its object from `platforms.json`.
2. Optionally delete `templates/<output>/`.
3. `npm run build` and reload the extension.

## Templates

`templates/<output>/index.ejs` is applied after the `web-mobile` build. It must include:

- `<%= projectName %>`
- `<%- include(cocosTemplate, {}) %>` (replaced with the engine bootstrap from the built `index.html`)

Other files in that folder are copied into the output. Extra files that belong only to another platform’s template are removed from this output so SDKs and helpers do not leak across targets.
