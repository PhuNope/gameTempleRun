import { _decorator, ColliderComponent, Component, ITriggerEvent, Node } from 'cc';
import { PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

@ccclass('ColliderChecker')
export class ColliderChecker extends Component {
    @property(PlayerController)
    playerController: PlayerController;

    start() {
        const collider = this.getComponent(ColliderComponent);
        collider.on("onTriggerEnter", this.onTriggerEnter, this);
    }

    onTriggerEnter(event: ITriggerEvent) {
        if (this.playerController) {
            this.playerController.onTriggerEnter(event);
        }
    }

    update(deltaTime: number) {

    }
}


