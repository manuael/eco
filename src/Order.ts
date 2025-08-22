import type { OrderSide } from "./interfaces.js";

export class Order {
    public id: string;
    public stationId: string;
    public ware: string;
    public side: OrderSide;
    public qty: number;
    public price: number;
    public createdAt: number;
    public expiresAt: number;

    constructor(id: string, stationId: string, ware: string, side: OrderSide, qty: number, price: number, lifetime: number = 30000) {
        this.id = id;
        this.stationId = stationId;
        this.ware = ware;
        this.side = side;
        this.qty = qty;
        this.price = price;
        this.createdAt = Date.now();
        this.expiresAt = this.createdAt + lifetime;
    }

    isExpired(): boolean {
        return Date.now() > this.expiresAt;
    }

    timeToExpiry(): number {
        return Math.max(0, this.expiresAt - Date.now());
    }
}