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