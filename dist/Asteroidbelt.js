export class AsteroidBelt {
    id;
    type;
    location;
    quantity;
    maxQuantity;
    constructor(id, type, location, quantity = 1000) {
        this.id = id;
        this.type = type;
        this.location = location;
        this.quantity = quantity;
        this.maxQuantity = quantity;
    }
    mineOre(amount) {
        const mined = Math.min(amount, this.quantity);
        this.quantity -= mined;
        return mined;
    }
}
//# sourceMappingURL=Asteroidbelt.js.map