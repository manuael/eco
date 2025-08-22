import { Order } from "./Order.js";
import type { OrderBook, TradeRecord, MarketStats } from "./interfaces.js";
export declare class MarketExchange {
    private orderBooks;
    private priceHistory;
    private marketStats;
    private tradeHistory;
    private nextOrderId;
    private stations;
    private lastCleanup;
    private cleanupInterval;
    constructor();
    registerStation(station: any): void;
    private initializeWare;
    private getBasePrice;
    update(): void;
    private cleanupExpiredOrders;
    addOrder(order: Order): string;
    private matchOrders;
    private executeTradeWithStations;
    private recordTrade;
    private updatePriceHistory;
    private updateMarketStats;
    getCurrentPrice(ware: string): number;
    getMarketStats(ware: string): MarketStats | null;
    getOrderBook(ware: string): OrderBook | null;
    getBestBidAsk(ware: string): {
        bid: number | null;
        ask: number | null;
    };
    getSupplyDemandRatio(ware: string): number;
    getAllWares(): string[];
    getRecentTrades(ware?: string, limit?: number): TradeRecord[];
}
//# sourceMappingURL=MarketExchange.d.ts.map