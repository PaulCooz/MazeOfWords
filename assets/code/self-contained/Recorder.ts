import { _decorator, Component, director, DirectorEvent, game, input, Input, KeyCode } from 'cc'
const { ccclass } = _decorator

@ccclass('Recorder')
export class Recorder extends Component {
    private recorder: MediaRecorder
    private chunks: Blob[] = []

    onLoad() {
        input.on(Input.EventType.KEY_DOWN, (e) => {
            if (e.keyCode == KeyCode.KEY_S)
                this.screenshot()
            else if (e.keyCode == KeyCode.KEY_V)
                this.toggleVideo()
        }, this)
    }

    screenshot() {
        director.once(DirectorEvent.AFTER_DRAW, () => {
            copyCanvas().toBlob(blob => save('screenshot.png', blob), 'image/png')
        })
    }

    toggleVideo() {
        if (this.recorder?.state == 'recording') {
            this.recorder.stop()
            this.recorder = null
            return
        }

        this.chunks = []
        const mime = [
            'video/mp4;codecs=avc1',
            'video/mp4',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
        ].find(t => MediaRecorder.isTypeSupported(t))
        const rec = new MediaRecorder(game.canvas.captureStream(60), mime ? { mimeType: mime } : undefined)
        rec.ondataavailable = e => {
            if (e.data.size > 0)
                this.chunks.push(e.data)
        }
        const ext = rec.mimeType.includes('mp4') ? 'mp4' : 'webm'
        rec.onstop = () => save(`video.${ext}`, new Blob(this.chunks, { type: rec.mimeType }))
        rec.start()
        this.recorder = rec

        console.log("start recording")
    }
}

function copyCanvas() {
    const src = game.canvas
    const dst = document.createElement('canvas')
    dst.width = src.width
    dst.height = src.height
    dst.getContext('2d').drawImage(src, 0, 0)
    return dst
}

let dir: any
async function save(name: string, blob: Blob) {
    if (blob == null)
        return
    try {
        if (dir == null)
            dir = await (globalThis as any).showDirectoryPicker({ id: 'recorder', mode: 'readwrite' })
        const w = await (await dir.getFileHandle(name, { create: true })).createWritable()
        await w.write(blob)
        await w.close()
        return
    } catch {
        // ignore
    }
    const a = document.createElement('a')
    a.download = name
    a.href = URL.createObjectURL(blob)
    a.click()
    URL.revokeObjectURL(a.href)
}
