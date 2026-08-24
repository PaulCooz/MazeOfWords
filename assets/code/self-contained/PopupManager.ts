import { _decorator, Component, Constructor, instantiate, Node, Prefab } from 'cc'
import { Popup } from './Popup'
import { Delegate } from './Delegate'
const { ccclass, property } = _decorator

@ccclass('PopupManager')
export class PopupManager extends Component {
    @property(Node)
    root: Node
    @property([Prefab])
    prefabs: Prefab[] = []

    static readonly onPushPopup = new Delegate()
    static readonly onHidePopup = new Delegate()
    static readonly onPopPopup = new Delegate()

    private static _instance: PopupManager

    private prefabByType = new Map<Function, Prefab>()
    private openPopups: Popup[] = []

    public setup() { // call it manually!
        PopupManager._instance = this

        for (const prefab of this.prefabs) {
            const popup = (prefab.data as Node)?.getComponent(Popup)
            if (popup == null)
                throw new Error(`Prefab missing Popup component: ${prefab.name}`)
            this.prefabByType.set(popup.constructor, prefab)
        }
    }

    onDestroy() {
        if (PopupManager._instance == this)
            PopupManager._instance = undefined
    }

    static show<TResult, T extends Popup<TResult>>(type: Constructor<T>, params?: Partial<T>): T {
        return PopupManager._instance.show(type, params)
    }

    static get<T extends Popup>(type: Constructor<T>): T | null {
        return PopupManager._instance.get(type)
    }

    static empty() {
        return PopupManager._instance.empty()
    }

    private show<TResult, T extends Popup<TResult>>(type: Constructor<T>, params?: Partial<T>): T {
        const existing = this.get(type)
        if (existing)
            return existing

        const prefab = this.prefabByType.get(type)
        if (prefab == null)
            throw new Error(`Popup prefab not registered: ${type.name}`)

        const node = instantiate(prefab)
        const popup = node.getComponent(type)
        node.setParent(this.root ?? this.node)

        this.openPopups.push(popup as Popup)
        PopupManager.onPushPopup.emit()
        popup.onHide.once(() => PopupManager.onHidePopup.emit())
        popup.onClosed.once(() => {
            const i = this.openPopups.indexOf(popup as Popup)
            if (i >= 0) {
                this.openPopups.splice(i, 1)
                PopupManager.onPopPopup.emit()
            }
        })

        popup.setup(params)
        popup.show()
        return popup
    }

    private get<TResult, T extends Popup<TResult>>(type: Constructor<T>): T | null {
        for (let i = this.openPopups.length - 1; i >= 0; i--) {
            const popup = this.openPopups[i]
            if (popup instanceof type)
                return popup as T
        }
        return null
    }

    private empty() {
        return this.openPopups.length == 0
    }
}
