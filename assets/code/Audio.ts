import { _decorator, AssetManager, AudioClip, AudioSource } from 'cc'
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

    private static _instance: Audio

    private rand: Rand

    public awake(): void {
        Audio._instance = this

        PlayerStorage.sound.onChange.append(v => this.sound.volume = v)
        PlayerStorage.music.onChange.append(v => this.music.volume = v)
        onYaPause.append(paused => {
            this.sound.volume = paused ? 0 : 1
            this.music.volume = paused ? 0 : PlayerStorage.music.value
        })

        this.rand = new Rand(Date.now())

        loadBundle("music")
            .then(b => this.playMusic(b))
            .catch(console.error)
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
            this.music.volume = PlayerStorage.music.value
            this.music.play()
        }
    }

    private async playMusic(bundle: AssetManager.Bundle) {
        const paths = bundle.getDirWithPath("/", AudioClip, []).map(c => c.path)

        const rand = new Rand(Date.now())
        rand.shuffle(paths)

        for (let i = 0; ; i = (i + 1) % paths.length) {
            const clip = await loadFile<AudioClip>(paths[i], bundle)

            this.play(clip, 1, false)
            await waitSec(clip.getDuration())

            bundle.release(paths[i])
            await waitSec(1)
        }
    }
}
