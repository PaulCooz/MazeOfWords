import { Asset, AssetManager, assetManager, TextAsset } from "cc"

export function loadBundle(name: string): Promise<AssetManager.Bundle> {
    return new Promise((resolve, reject) => {
        assetManager.loadBundle(name, (err, bundle) => {
            if (err)
                reject(err)
            else
                resolve(bundle)
        })
    })
}

export function loadFile<T extends Asset>(path: string, bundle: AssetManager.Bundle): Promise<T> {
    return new Promise((resolve, reject) => {
        bundle.load<T>(path, (err, data) => {
            if (err)
                reject(err)
            else
                resolve(data)
        })
    })
}
