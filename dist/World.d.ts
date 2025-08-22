import { Station } from "./Station.js";
import { Ship } from "./Ship.js";
import { AsteroidBelt } from "./Asteroidbelt.js";
import { Recipe } from "./Recipe.js";
import type { OrderBook, TradeRecord } from "./interfaces.js";
export declare class World {
    stations: Station[];
    ships: Ship[];
    asteroidBelts: AsteroidBelt[];
    recipes: Recipe[];
    orderBook: OrderBook;
    tradeLog: TradeRecord[];
    time: number;
    constructor();
    update(deltaTime: number): void;
    assignShipTask(ship: Ship): void;
    findNearestStation(location: [number, number]): Station | null;
    addTrade(from: string, to: string, ware: string, quantity: number, price: number): void;
}
//# sourceMappingURL=World.d.ts.map