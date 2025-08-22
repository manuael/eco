import type { OrderSide } from "./interfaces.js";
export declare class Order {
    id: string;
    stationId: string;
    ware: string;
    side: OrderSide;
    qty: number;
    price: number;
    constructor(id: string, stationId: string, ware: string, side: OrderSide, qty: number, price: number);
}
//# sourceMappingURL=Order.d.ts.map