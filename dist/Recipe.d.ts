import type { ResourceItem, Stock } from "./interfaces.js";
export declare class Recipe {
    id: string;
    inputs: ResourceItem[];
    outputs: ResourceItem[];
    duration: number;
    energyReq: number;
    constructor(id: string, inputs: ResourceItem[], outputs: ResourceItem[], duration: number, energyReq: number);
    canProduce(stock: Stock): boolean;
}
//# sourceMappingURL=Recipe.d.ts.map