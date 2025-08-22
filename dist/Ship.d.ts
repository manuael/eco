import type { ShipType, ShipState, NextAction, Stock } from "./interfaces.js";
export declare class Ship {
    id: string;
    type: ShipType;
    location: [number, number];
    target: [number, number] | null;
    cargoCap: number;
    cargo: Stock;
    speed: number;
    state: ShipState;
    actionTimer: number;
    nextAction: NextAction | null;
    constructor(id: string, type: ShipType, location: [number, number], cargoCap?: number);
    update(deltaTime: number): void;
    moveTo(target: [number, number], nextAction?: NextAction | null): void;
    completeAction(): void;
    getCurrentCargo(): number;
}
//# sourceMappingURL=Ship.d.ts.map