import { _decorator, AnimationComponent, Component, EventTouch, Input, input, Node, SkeletalAnimation, sys, tween, Vec2, Vec3 } from 'cc';
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
    private _gameState: GameState;

    start() {
        this.playerAnimation.play(PlayerAnimationStatus.idle);

        this.onGamePlaying();
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
        this.playerAnimation.on(AnimationComponent.EventType.FINISHED, this.onJumpEnd, this.playerAnimation.getState(PlayerAnimationStatus.jump));

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onGameEnd() {
        this.playerAnimation.off(AnimationComponent.EventType.FINISHED, this.onJumpEnd, this);

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
        }
    }

    move(moveAction: MoveAction) {
        switch (moveAction) {
            case MoveAction.LEFT:
                if (this._moveState === MoveState.RUNNING) {
                    tween(this.node)
                        .by(0.1, { position: new Vec3(GameDefines.leftLineX, 0, 0) }, {
                            easing: "sineOutIn", onComplete: () => {
                                this._moveState = MoveState.RUNNING;
                            }
                        })
                        .start();

                    this._moveState = MoveState.MOVING_LEFT;
                }

                break;

            case MoveAction.RIGHT:
                if (this._moveState === MoveState.RUNNING) {
                    tween(this.node)
                        .by(0.1, { position: new Vec3(GameDefines.rightLineX, 0, 0) }, {
                            easing: "sineOutIn", onComplete: () => {
                                this._moveState = MoveState.RUNNING;
                            }
                        })
                        .start();

                    this._moveState = MoveState.MOVING_RIGHT;
                }

                break;

            case MoveAction.UP:
                if (this._moveState === MoveState.RUNNING) {
                    this.playerAnimation.crossFade(PlayerAnimationStatus.jump);
                    let state = this.playerAnimation.getState(PlayerAnimationStatus.jump);
                    state.speed = 1;

                    tween(this.node)
                        .by(0.5, { position: new Vec3(0, 0, 10) }, {
                            easing: "sineOutIn", onComplete: () => {
                                this._moveState = MoveState.RUNNING;
                                this.playerAnimation.crossFade(PlayerAnimationStatus.run);
                            }
                        })
                        .start();

                    //this._moveState = MoveState.JUMPING;
                }

                break;
        }
    }

    update(deltaTime: number) {
        this.node.translate(new Vec3(0, 0, 1));
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}


