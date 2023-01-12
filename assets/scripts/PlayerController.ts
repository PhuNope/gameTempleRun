import { _decorator, AnimationComponent, Collider, Component, Contact2DType, EPhysics2DDrawFlags, EventTouch, Input, input, IPhysics2DContact, ITriggerEvent, Node, PhysicsSystem2D, SkeletalAnimation, sys, tween, Vec2, Vec3 } from 'cc';
import { GameDefines, GameState } from './GameDefines';

const { ccclass, property } = _decorator;

enum MoveAction {
    LEFT,
    RIGHT,
    UP
}

enum MoveState {
    RUNNING,
    MOVING_LEFT,
    MOVING_RIGHT,
    JUMPING
}

const PlayerAnimationStatus = {
    idle: "Holding Idle",
    run: "Running",
    jump: "Jump",
    dead: "Falling Back Death"
};

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property({ type: Number })
    speed: number;

    @property(SkeletalAnimation)
    public playerAnimation: SkeletalAnimation;

    private _moveState: MoveState;
    private _gameState: GameState = GameState.INIT;

    public onTriggerBlock: (roadBlockNode: Node) => void;

    private debugPhysic() { PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb | EPhysics2DDrawFlags.Pair | EPhysics2DDrawFlags.CenterOfMass | EPhysics2DDrawFlags.Joint | EPhysics2DDrawFlags.Shape; PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.All; }

    start() {
        this.playerAnimation.play(PlayerAnimationStatus.idle);

        //this.onGamePlaying();

        this.debugPhysic();
    }

    onGameStartChanged(state: GameState) {
        switch (state) {
            case GameState.INIT:
                this.onGameInit();
                break;
            case GameState.PLAYING:
                this.onGamePlaying();
                break;
            case GameState.END:
                this.onGameEnd();
                break;
        }

        this._gameState = state;
    }

    onGameInit() {
        this.playerAnimation.play(PlayerAnimationStatus.idle);
        this.node.setPosition(new Vec3(0, 0, 0));
    }

    onGamePlaying() {
        this._moveState = MoveState.RUNNING;
        this.playerAnimation.play(PlayerAnimationStatus.run);

        //const jumpState: AnimationState = this.playerAnimation.getState(PlayerAnimationStatus.jump);
        //this.playerAnimation.on(AnimationComponent.EventType.FINISHED, this.onJumpEnd, this.playerAnimation.getState(PlayerAnimationStatus.jump));

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onGameEnd() {
        // tween(this.node)
        //     .by(2.19, {}, {
        //         onStart: () => {
        //             this.playerAnimation.crossFade(PlayerAnimationStatus.dead);
        //         },
        //         onComplete: () => {
        //             this.playerAnimation.pause();

        //             input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        //             input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        //         }
        //     });

        // this.playerAnimation.off(AnimationComponent.EventType.FINISHED, this.onJumpEnd, this);

        // input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        // input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        this.playerAnimation.crossFade(PlayerAnimationStatus.dead);

        setTimeout(() => {
            this.playerAnimation.pause();
        }, 2190);

        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onJumpEnd(type, state) {
        if (state?.name === PlayerAnimationStatus.jump) {
            this.playerAnimation.play(PlayerAnimationStatus.run);
            this._moveState = MoveState.RUNNING;
        }
    }

    private vec_start: Vec2 = new Vec2;

    onTouchStart(event: EventTouch) {
        this.vec_start = event.getUILocation();
    }

    onTouchEnd(event: EventTouch) {
        const vec_end: Vec2 = event.getUILocation();

        let vec_delta: Vec2 = new Vec2();
        Vec2.subtract(vec_delta, this.vec_start, vec_end);

        if (Math.abs(vec_delta.x) > Math.abs(vec_delta.y) && Math.abs(vec_delta.y) < 150) {
            if (this.vec_start.x > vec_end.x) {
                this.move(MoveAction.LEFT);
            } else {
                this.move(MoveAction.RIGHT);
            }
        }

        if (Math.abs(vec_delta.x) < Math.abs(vec_delta.y) && this.vec_start.y < vec_end.y) {
            this.move(MoveAction.UP);
            this.playerAnimation.crossFade(PlayerAnimationStatus.jump);
        }
    }

    onTriggerEnter(event: ITriggerEvent) {
        const triggerNode: Node = event.otherCollider.node;

        if (triggerNode.name === "RoadBlock") {
            if (this.onTriggerBlock) {
                this.onTriggerBlock(triggerNode);
            }
        }
    }

    move(moveAction: MoveAction) {
        switch (moveAction) {
            case MoveAction.LEFT:
                if (this._moveState === MoveState.RUNNING) {
                    this._moveState = MoveState.MOVING_LEFT;
                    this.v3_a = new Vec3(this.node.getPosition().x + GameDefines.leftLineX, 0, 0);
                }

                break;

            case MoveAction.RIGHT:
                if (this._moveState === MoveState.RUNNING) {
                    this._moveState = MoveState.MOVING_RIGHT;
                    this.v3_a = new Vec3(this.node.getPosition().x + GameDefines.rightLineX, 0, 0);
                }

                break;

            case MoveAction.UP:
                //set forward
                if (this._moveState === MoveState.RUNNING) {

                    this.playerAnimation.crossFade(PlayerAnimationStatus.jump);

                    setTimeout(() => {
                        this.playerAnimation.crossFade(PlayerAnimationStatus.run);
                    }, 870);
                }

                break;
        }
    }

    private v3_a: Vec3;
    private v3_b: Vec3;

    update(deltaTime: number) {
        if (this._gameState === GameState.PLAYING) {
            if (this._moveState === MoveState.MOVING_LEFT) {
                if (this.node.getPosition().x >= this.v3_a.x) {
                    this._moveState = MoveState.RUNNING;
                } else {
                    // Vec3.lerp(this.v3_b, this.node.getPosition(), new Vec3(this.v3_a.x, 0, this.node.getPosition().z), 0.125);

                    this.v3_b = new Vec3(this.node.getPosition().x + 0.125, 0, this.node.getPosition().z);

                    this.node.setPosition(this.v3_b);
                }
            }

            if (this._moveState === MoveState.MOVING_RIGHT) {
                if (this.node.getPosition().x <= this.v3_a.x) {
                    this._moveState = MoveState.RUNNING;
                } else {
                    // Vec3.lerp(this.v3_b, this.node.getPosition(), new Vec3(this.v3_a.x, 0, this.node.getPosition().z), 0.125);

                    this.v3_b = new Vec3(this.node.getPosition().x - 0.125, 0, this.node.getPosition().z);

                    this.node.setPosition(this.v3_b);
                }
            }

            this.node.translate(new Vec3(0, 0, this.speed * deltaTime));
        }
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}


