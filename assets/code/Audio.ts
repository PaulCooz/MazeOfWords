import { _decorator, AssetManager, AudioClip, AudioSource, Canvas, Input, input } from 'cc'
import { PipelineComponent } from './PipelineComponent'
import { waitSec } from './self contained/Utils'
import { PlayerStorage } from './PlayerStorage'
import { loadBundle, loadFile } from './self contained/Engine'
import { Rand } from './self contained/Rand'
import { onYaPause } from './self contained/Yandex'
const { ccclass, property } = _decorator

@ccclass('Audio')
export class Audio extends PipelineComponent {
    @property(AudioSource)
    sound: AudioSource
    @property(AudioSource)
    music: AudioSource

    @property(Canvas)
    canvas: Canvas
    private bundle: AssetManager.Bundle

    private rand: Rand
    private paused: boolean

    private static _instance: Audio

    public load(): void {
        Audio._instance = this

        PlayerStorage.sound.onChange.append(v => this.sound.volume = v)
        PlayerStorage.music.onChange.append(v => this.music.volume = v)
        onYaPause.append(paused => {
            this.paused = paused
            this.sound.volume = paused ? 0 : 1
            this.music.volume = paused ? 0 : PlayerStorage.music.value
        })

        this.rand = new Rand(Date.now())

        loadBundle("music")
            .then(b => this.bundle = b)
            .catch(console.error)

        input.on(Input.EventType.TOUCH_END, this.tryStartMusic, this)
        this.canvas.node.on(Input.EventType.TOUCH_END, this.tryStartMusic, this)
    }

    private tryStartMusic() {
        if (this.bundle) {
            this.playMusic()

            input.off(Input.EventType.TOUCH_END, this.tryStartMusic, this)
            this.canvas.node.off(Input.EventType.TOUCH_END, this.tryStartMusic, this)
        }
    }

    public static playSound(clip: AudioClip, soundScale: number = 1) {
        Audio._instance.play(clip, soundScale, true)
    }

    public static playSoundRand(clips: AudioClip[], soundScale: number = 1) {
        const clip = clips[Audio._instance.rand.rangeInt(0, clips.length)]
        this.playSound(clip, soundScale)
    }

    private play(clip: AudioClip, soundScale: number, isSound: boolean) {
        if (isSound) {
            this.sound.playOneShot(clip, soundScale * PlayerStorage.sound.value)
        } else {
            this.music.clip = clip
            this.music.volume = this.paused ? 0 : PlayerStorage.music.value
            this.music.play()
        }
    }

    private async playMusic() {
        const bundle = this.bundle
        const paths = bundle.getDirWithPath("/", AudioClip, []).map(c => c.path)

        const rand = new Rand(Date.now())
        rand.shuffle(paths)

        for (let i = 0; ; i = (i + 1) % paths.length) {
            const clip = await loadFile<AudioClip>(paths[i], bundle)

            this.play(clip, 1, false)
            await waitSec(clip.getDuration())

            this.music.stop() // possible bugfix with two clips at once
            this.music.clip = undefined
            bundle.release(paths[i])

            await waitSec(1)
        }
    }
}
