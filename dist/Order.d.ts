import type { OrderSide } from "./interfaces.js";
export declare class Order {
    id: string;
    stationId: string;
    ware: string;
    side: OrderSide;
    qty: number;
    price: number;
    createdAt: number;
    expiresAt: number;
    constructor(id: string, stationId: string, ware: string, side: OrderSide, qty: number, price: number, lifetime?: number);
    isExpired(): boolean;
    timeToExpiry(): number;
}
//# sourceMappingURL=Order.d.ts.map