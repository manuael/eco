import { Order } from "./Order.js";
import { Recipe } from "./Recipe.js";
import type { Stock } from "./interfaces.js";
type StationType = 'factory' | 'mine' | 'trade';
export declare class Station {
    id: string;
    name: string;
    location: [number, number];
    type: StationType;
    stock: Stock;
    credits: number;
    recipes: Recipe[];
    productionQueue: Recipe[];
    storageCapacity: number;
    productionTimer: number;
    orders: Order[];
    constructor(id: string, name: string, location: [number, number], type?: StationType);
    addRecipe(recipe: Recipe): void;
    update(deltaTime: number): void;
    addStock(ware: string, quantity: number): void;
}
export {};
//# sourceMappingURL=Station.d.ts.map