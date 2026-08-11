import { _decorator, Label, Slider, Sprite, SpriteFrame } from 'cc'
import { Popup } from './self contained/Popup'
import { PlayerStorage } from './PlayerStorage'
import { localize } from './Lang'
import { Locale } from './Common'
const { ccclass, property } = _decorator

@ccclass('SettingsPopup')
export class SettingsPopup extends Popup {
    @property(Slider)
    soundSlider: Slider
    @property(Slider)
    musicSlider: Slider

    @property(Label)
    langLabel: Label
    @property(Sprite)
    langSprite: Sprite

    @property(SpriteFrame)
    enFlag: SpriteFrame
    @property(SpriteFrame)
    ruFlag: SpriteFrame

    onSetup() {
        this.soundSlider.progress = PlayerStorage.sound.value
        this.musicSlider.progress = PlayerStorage.music.value

        PlayerStorage.lang.onChange.append(this.langChange, this)
        this.langChange(PlayerStorage.lang.value)
    }

    private langChange(lang: Locale) {
        this.langLabel.string = localize(lang)
        this.langSprite.spriteFrame = this[lang + "Flag"]
    }

    public switchLang() {
        switch (PlayerStorage.lang.value) {
            case "en":
                PlayerStorage.lang.value = "ru"
                break
            case "ru":
                PlayerStorage.lang.value = "en"
                break
        }
    }

    slideSound(s: Slider) {
        PlayerStorage.sound.value = s.progress
    }
    slideMusic(s: Slider) {
        PlayerStorage.music.value = s.progress
    }

    onClose() {
        PlayerStorage.lang.onChange.pop(this.langChange, this)
    }
}
