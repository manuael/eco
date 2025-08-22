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
    averagePrice: number; // last 24h
    volume: number; // trades in last period
    spread: number; // bid-ask spread
    volatility: number;
    supplyLevel: number; // total sell orders
    demandLevel: number; // total buy orders
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
    minStockThreshold: number; // when to start buying (as percentage of capacity)
    maxStockThreshold: number; // when to start selling (as percentage of capacity)
    urgencyMultiplier: number; // how desperate affects pricing
    profitMargin: number; // desired profit margin for sales
    maxOrderSize: number; // maximum single order size
    priceTolerancePercent: number; // how much above/below market price to trade
    orderLifetime: number; // how long orders stay active (in seconds)
    priceAdjustmentRate: number; // how much to adjust prices after success/failure
    minPriceMultiplier: number; // minimum price as multiple of base cost
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