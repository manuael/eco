export class Order {
    id;
    stationId;
    ware;
    side;
    qty;
    price;
    createdAt;
    expiresAt;
    constructor(id, stationId, ware, side, qty, price, lifetime = 30000) {
        this.id = id;
        this.stationId = stationId;
        this.ware = ware;
        this.side = side;
        this.qty = qty;
        this.price = price;
        this.createdAt = Date.now();
        this.expiresAt = this.createdAt + lifetime;
    }
    isExpired() {
        return Date.now() > this.expiresAt;
    }
    timeToExpiry() {
        return Math.max(0, this.expiresAt - Date.now());
    }
}
//# sourceMappingURL=Order.js.map