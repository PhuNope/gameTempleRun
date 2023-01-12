class GameDefines {
    static floorLength: number = 10;
    static maxActiveFloor: number = 50;
    static leftLineX: number = 3;
    static rightLineX: number = -3;
    static middleLineX: number = 0;

    static BlockNodeName: string = "RoadBlock";
}

enum GameState {
    INIT,
    PLAYING,
    END
}

export { GameDefines, GameState };