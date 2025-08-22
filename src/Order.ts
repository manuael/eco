import type { OrderSide } from "./interfaces.js";

export class Order {
    public id: string;
    public stationId: string;
    public ware: string;
    public side: OrderSide;
    public qty: number;
    public price: number;

    constructor(id: string, stationId: string, ware: string, side: OrderSide, qty: number, price: number) {
        this.id = id;
        this.stationId = stationId;
        this.ware = ware;
        this.side = side;
        this.qty = qty;
        this.price = price;
    }
}