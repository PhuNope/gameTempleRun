import { _decorator, AnimationComponent, Component, instantiate, math, Node, NodePool, Prefab, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';
import { GameDefines, GameState } from './GameDefines';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Prefab)
    public roadPrefab: Prefab;

    @property(Prefab)
    public roadBlockPrefab: Prefab;

    @property(PlayerController)
    public playerController: PlayerController;

    @property(Node)
    public initPanel: Node;
    @property(Node)
    public endPanel: Node;

    private roadPool: NodePool = new NodePool();
    private roadBlockPool: NodePool = new NodePool();
    private _activeRoad: Node[] = [];
    private _currentState: GameState = GameState.INIT;


    set currentState(value: GameState) {
        switch (value) {
            case GameState.INIT:
                this.initPanel.active = true;
                this.endPanel.active = false;
                this.reset();

                break;

            case GameState.PLAYING:
                this.initPanel.active = false;

                break;

            case GameState.END:
                this.endPanel.active = true;

                break;
        }
    }

    get currentState() {
        return this._currentState;
    }

    reset() {
        this._activeRoad.forEach((roadNode: Node) => {
            this.destroyRoad(roadNode);
        });

        this._activeRoad = [];

        //init
        for (let i = 0; i < GameDefines.maxActiveFloor; i++) {
            const positionZ = i * GameDefines.floorLength;

            let needItem = false;
            if (i > 1) {
                needItem = true;
            }

            this.generateRoad(new Vec3(0, 0, positionZ), needItem);
        }
    }

    destroyRoad(roadNode: Node) {
        for (let i = 0; i < roadNode.children.length; i++) {
            const child = roadNode.children[i];

            if (child.name === GameDefines.BlockNodeName) {
                child.parent = null;
                this.roadBlockPool.put(child);
            }
        }

        this.roadPool.put(roadNode);
    }

    generateRoad(pos: Vec3, generateItem: boolean = false) {
        let roadNode = this.createRoad(pos);

        this._activeRoad.push(roadNode);

        if (generateItem) {
            const generateType = math.randomRangeInt(0, 3);

            if (generateType === 1) {
                this.createRoadBlock(roadNode, new Vec3(this.randomXPosition(), 0, 0));
            }
        }
    }

    randomXPosition() {
        const posXPool: number[] = [GameDefines.leftLineX, GameDefines.middleLineX, GameDefines.rightLineX];
        const index = math.randomRangeInt(0, 3);
        const posX: number = posXPool[index];

        return posX;
    }

    createRoad(position: Vec3) {
        let road: Node = null;

        if (this.roadPool.size() > 0) {
            road = this.roadPool.get();
        } else {
            road = instantiate(this.roadPrefab);
        }

        road.setPosition(position);
        road.setParent(this.node);

        return road;
    }

    createRoadBlock(parent: Node, localPosition: Vec3) {
        let roadBlock: Node = null;

        if (this.roadBlockPool.size() > 0) {
            roadBlock = this.roadBlockPool.get();
        } else {
            roadBlock = instantiate(this.roadBlockPrefab);
        }

        roadBlock.setPosition(localPosition);
        roadBlock.setParent(parent);

        const animComp = roadBlock.getComponent(AnimationComponent);
        const downName = 'block_down';
        const state = animComp.getState(downName);
        state.setTime(0);
        state.sample();

        return roadBlock;
    }

    private _checkPassTime: number = 0;
    private _checkInterval: number = 1;

    checkToGenerateItem(deltaTime: number) {
        this._checkPassTime += deltaTime;
        if (this._checkPassTime > this._checkInterval) {
            let backIndex = 0;

            for (let i = 0; i < this._activeRoad.length; i++) {
                const road = this._activeRoad[i];

                if (road.position.z > (this.playerController.node.position.z - GameDefines.floorLength)) {
                    backIndex = i;

                    break;
                }
            }

            if (backIndex > 0) {
                for (let i = 0; i < backIndex; i++) {
                    const first: Node = this._activeRoad.shift();

                    this.destroyRoad(first);

                    const last = this._activeRoad[this._activeRoad.length - 1];
                    const positionZ = last.position.z + GameDefines.floorLength;

                    this.generateRoad(new Vec3(0, 0, positionZ), true);
                }
            }
        }
    }

    start() {
        this.currentState = GameState.INIT;

        this.playerController.onTriggerBlock = this.onBlockTrigger.bind(this);
    }

    update(deltaTime: number) {
        this.checkToGenerateItem(deltaTime);
    }

    onStartButtonClick() {
        this.currentState = GameState.PLAYING;
        this.playerController.onGameStartChanged(GameState.PLAYING);
    }

    onRestartButtonClick() {
        this.currentState = GameState.INIT;
        this.playerController.onGameStartChanged(GameState.INIT);
    }

    onBlockTrigger(blockNode: Node) {
        this.currentState = GameState.END;
        this.playerController.onGameStartChanged(GameState.END);
    }
}


