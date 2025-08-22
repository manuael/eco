import type { ResourceItem, Stock } from "./interfaces.js";

export class Recipe {
    public id: string;
    public inputs: ResourceItem[];
    public outputs: ResourceItem[];
    public duration: number;
    public energyReq: number;

    constructor(id: string, inputs: ResourceItem[], outputs: ResourceItem[], duration: number, energyReq: number) {
        this.id = id;
        this.inputs = inputs;
        this.outputs = outputs;
        this.duration = duration;
        this.energyReq = energyReq;
    }

    canProduce(stock: Stock): boolean {
        return this.inputs.every(input => {
            const stockAmount = stock[input.ware];
            return stockAmount && stockAmount >= input.qty;
        });
    }
}