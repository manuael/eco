import { Order } from "./Order.js";
export type ShipType = 'TRADER' | 'MINER';
export type ShipState = 'idle' | 'moving' | 'trading' | 'mining';
export type OrderSide = 'BUY' | 'SELL';
export interface ResourceItem {
    ware: string;
    qty: number;
}
export interface Stock {
    [ware: string]: number;
}
export interface NextAction {
    state: ShipState;
    timer: number;
}
export interface TradeRecord {
    time: number;
    from: string;
    to: string;
    ware: string;
    quantity: number;
    price: number;
}
export interface OrderBook {
    buy: Order[];
    sell: Order[];
}
export interface PriceHistory {
    prices: PricePoint[];
    currentPrice: number;
    volume24h: number;
}
export interface PricePoint {
    time: number;
    price: number;
    volume: number;
}
export interface MarketStats {
    currentPrice: number;
    averagePrice: number;
    volume: number;
    spread: number;
    volatility: number;
    supplyLevel: number;
    demandLevel: number;
    lastUpdateTime: number;
}
export interface TradeExecution {
    buyOrderId: string;
    sellOrderId: string;
    ware: string;
    quantity: number;
    price: number;
    buyerId: string;
    sellerId: string;
    timestamp: number;
}
export interface StationMarketConfig {
    minStockThreshold: number;
    maxStockThreshold: number;
    urgencyMultiplier: number;
    profitMargin: number;
    maxOrderSize: number;
    priceTolerancePercent: number;
    orderLifetime: number;
    priceAdjustmentRate: number;
    minPriceMultiplier: number;
}
export interface PriceMemory {
    ware: string;
    lastSellPrice: number;
    lastBuyPrice: number;
    successfulSells: number;
    successfulBuys: number;
    expiredSellOrders: number;
    expiredBuyOrders: number;
    lastTradeTime: number;
}
export interface OrderInfo {
    order: Order;
    createdAt: number;
    expiresAt: number;
}
//# sourceMappingURL=interfaces.d.ts.map