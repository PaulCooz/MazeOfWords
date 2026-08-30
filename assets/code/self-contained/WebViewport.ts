import { game, screen, Size } from "cc"

// Sync engine windowSize to the browser so touches/clicks track again.
export function installWebViewportFix() {
    let frame = 0
    const sync = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
            screen.windowSize = new Size(window.innerWidth, window.innerHeight)
            const canvas = game.canvas as HTMLCanvasElement | null
            if (!canvas)
                return
            void canvas.getBoundingClientRect()
            try {
                canvas.focus({ preventScroll: true })
            } catch {
                canvas.focus()
            }
        })
    }
    window.addEventListener("resize", sync)
    window.visualViewport?.addEventListener("resize", sync)
    document.addEventListener("fullscreenchange", sync)
    screen.on("window-resize", sync)
    screen.on("fullscreen-change", sync)
    sync()
}
