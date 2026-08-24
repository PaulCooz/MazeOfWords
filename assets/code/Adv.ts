import { Config } from "./Config"
import { showFullscreenAdv } from "./self-contained/Yandex"

export class Adv {
    private static lastFullscreen = Date.now()

    public static tryShowFullscreen() {
        if ((Date.now() - Adv.lastFullscreen) / 1000.0 < Config.interCooldown)
            return

        Adv.lastFullscreen = Date.now()
        showFullscreenAdv().then(success => {
            if (success)
                Adv.lastFullscreen = Date.now()
        })
    }
}
