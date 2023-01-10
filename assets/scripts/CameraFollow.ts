import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

let v3_a = new Vec3();
let v3_b = new Vec3();

@ccclass('CameraFollow')
export class CameraFollow extends Component {
    @property(Node)
    target: Node;

    @property({ type: Number })
    speed: number;

    @property(Vec3)
    public offset: Vec3 = new Vec3();

    @property(Vec3)
    public lookAtFromOffset: Vec3 = new Vec3();;



    start() {

    }

    update(deltaTime: number) {
        this.target.getWorldPosition(v3_a);
        Vec3.add(v3_b, v3_a, this.offset);
        Vec3.lerp(v3_b, this.node.position, v3_b, this.speed);
        this.node.setWorldPosition(v3_b);

        Vec3.add(v3_a, v3_a, this.lookAtFromOffset);
        this.node.lookAt(v3_a);
    }
}


