export class Recipe {
    id;
    inputs;
    outputs;
    duration;
    energyReq;
    constructor(id, inputs, outputs, duration, energyReq) {
        this.id = id;
        this.inputs = inputs;
        this.outputs = outputs;
        this.duration = duration;
        this.energyReq = energyReq;
    }
    canProduce(stock) {
        return this.inputs.every(input => {
            const stockAmount = stock[input.ware];
            return stockAmount && stockAmount >= input.qty;
        });
    }
}
//# sourceMappingURL=Recipe.js.map