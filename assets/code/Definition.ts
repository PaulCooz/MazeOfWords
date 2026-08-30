import { _decorator } from 'cc'
import { RevealButton } from './RevealButton'
import { Level } from './level/Level'
import { Locale, Locales } from './self-contained/Locale'
import { PopupManager } from './self-contained/PopupManager'
import { DefinitionPopup } from './DefinitionPopup'
const { ccclass } = _decorator

@ccclass('Definition')
export class Definition extends RevealButton {
    private level: Level
    private wikiOk: { [key in Locale]?: boolean } = {}

    load() {
        super.load()

        for (const locale of Locales) {
            this.isAvailable(`https://${locale}.wiktionary.org/favicon.ico`)
                .then((loaded) => this.wikiOk[locale] = loaded)
                .catch(() => this.wikiOk[locale] = false)
        }
    }

    isAvailable(url: string) {
        return new Promise<boolean>((resolve) => {
            const img = new Image()
            const timer = setTimeout(() => {
                img.src = ""
                resolve(false)
            }, 2000)
            img.onload = () => {
                clearTimeout(timer)
                resolve(true)
            }
            img.onerror = () => {
                clearTimeout(timer)
                resolve(false)
            }
            img.src = url
        })
    }

    levelStart(level: Level) {
        super.levelStart(level)
        this.level = level
    }

    levelFinish() {
        if (this.wikiOk[this.level.locale])
            this.show()
    }

    protected onClick() {
        const url = `https://${this.level.locale}.wiktionary.org/wiki/${encodeURIComponent(this.level.word)}`
        PopupManager.show(DefinitionPopup, { url })
    }
}
