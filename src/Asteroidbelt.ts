
export class AsteroidBelt {
    public id: string;
    public type: string;
    public location: [number, number];
    public quantity: number;
    public maxQuantity: number;

    constructor(id: string, type: string, location: [number, number], quantity: number = 1000) {
        this.id = id;
        this.type = type;
        this.location = location;
        this.quantity = quantity;
        this.maxQuantity = quantity;
    }

    mineOre(amount: number): number {
        const mined = Math.min(amount, this.quantity);
        this.quantity -= mined;
        return mined;
    }
}