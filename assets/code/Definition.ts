import { _decorator } from 'cc'
import { RevealButton } from './RevealButton'
import { Level } from './level/Level'
import { Locale, Locales } from './Common'
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
            fetch(`https://${locale}.wiktionary.org`, { method: 'HEAD' })
                .then((r) => this.wikiOk[locale] = r.ok)
                .catch(() => this.wikiOk[locale] = false)
        }
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
