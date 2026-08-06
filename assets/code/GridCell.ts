import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridCell')
export class GridCell extends Component {
    @property(Label)
    letter: Label

    public setup(letter: string) {
        this.letter.string = letter
    }
}
