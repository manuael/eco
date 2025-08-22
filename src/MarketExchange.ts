import { Order } from "./Order.js";
import type { OrderBook, TradeRecord, PriceHistory, MarketStats, TradeExecution, OrderSide } from "./interfaces.js";

export class MarketExchange {
    private orderBooks: Map<string, OrderBook> = new Map(); // per ware
    private priceHistory: Map<string, PriceHistory> = new Map();
    private marketStats: Map<string, MarketStats> = new Map();
    private tradeHistory: TradeRecord[] = [];
    private nextOrderId: number = 1;
    private stations: Map<string, any> = new Map(); // Station references for trade execution
    private lastCleanup: number = 0;
    private cleanupInterval: number = 5000; // Clean up expired orders every 5 seconds

    constructor() {
        // Initialize with basic wares
        this.initializeWare('iron');
        this.initializeWare('steel');
        this.initializeWare('ships');
    }

    // Register station for trade execution
    registerStation(station: any): void {
        this.stations.set(station.id, station);
    }

    private initializeWare(ware: string): void {
        this.orderBooks.set(ware, { buy: [], sell: [] });
        this.priceHistory.set(ware, {
            prices: [],
            currentPrice: this.getBasePrice(ware),
            volume24h: 0
        });
        this.marketStats.set(ware, {
            currentPrice: this.getBasePrice(ware),
            averagePrice: this.getBasePrice(ware),
            volume: 0,
            spread: 0,
            volatility: 0,
            supplyLevel: 0,
            demandLevel: 0,
            lastUpdateTime: Date.now()
        });
    }

    private getBasePrice(ware: string): number {
        // Base prices for different wares
        const basePrices: { [key: string]: number } = {
            'iron': 8,    // Reduced base price
            'steel': 20,  // Reduced base price
            'ships': 120  // Reduced base price
        };
        return basePrices[ware] || 40;
    }

    update(): void {
        // Clean up expired orders periodically
        if (Date.now() - this.lastCleanup > this.cleanupInterval) {
            this.cleanupExpiredOrders();
            this.lastCleanup = Date.now();
        }
    }

    private cleanupExpiredOrders(): void {
        this.orderBooks.forEach((orderBook, ware) => {
            // Remove expired buy orders
            const expiredBuyOrders = orderBook.buy.filter(order => order.isExpired());
            orderBook.buy = orderBook.buy.filter(order => !order.isExpired());

            // Remove expired sell orders
            const expiredSellOrders = orderBook.sell.filter(order => order.isExpired());
            orderBook.sell = orderBook.sell.filter(order => !order.isExpired());

            // Notify stations about expired orders
            [...expiredBuyOrders, ...expiredSellOrders].forEach(order => {
                const station = this.stations.get(order.stationId);
                if (station && station.onOrderExpired) {
                    station.onOrderExpired(order);
                }
                console.log(`⏰ Order expired: ${order.stationId} ${order.side} ${order.qty} ${order.ware} @ ${order.price.toFixed(2)}`);
            });

            if (expiredBuyOrders.length > 0 || expiredSellOrders.length > 0) {
                this.updateMarketStats(ware);
            }
        });
    }

    addOrder(order: Order): string {
        console.log(`Adding order: ${order.id}`, order);
        const orderId = `order_${this.nextOrderId++}`;
        order.id = orderId;

        if (!this.orderBooks.has(order.ware)) {
            this.initializeWare(order.ware);
        }

        const orderBook = this.orderBooks.get(order.ware)!;
        
        if (order.side === 'BUY') {
            orderBook.buy.push(order);
            // Sort buy orders by price (highest first)
            orderBook.buy.sort((a, b) => b.price - a.price);
        } else {
            orderBook.sell.push(order);
            // Sort sell orders by price (lowest first)
            orderBook.sell.sort((a, b) => a.price - b.price);
        }

        // Try to match orders immediately
        const executions = this.matchOrders(order.ware);
        this.updateMarketStats(order.ware);

        return orderId;
    }

    private matchOrders(ware: string): TradeExecution[] {
        console.log(`Matching orders for: ${ware}`);
        const orderBook = this.orderBooks.get(ware);
        if (!orderBook) return [];

        const executions: TradeExecution[] = [];
        const buyOrders = orderBook.buy;
        const sellOrders = orderBook.sell;

        while (buyOrders.length > 0 && sellOrders.length > 0) {
            const bestBuy = buyOrders[0];
            const bestSell = sellOrders[0];

            console.log(`Best buy: ${bestBuy?.id}`, bestBuy);
            console.log(`Best sell: ${bestSell?.id}`, bestSell);

            // Check if orders can match (buy price >= sell price)
            if (bestBuy && bestSell && bestBuy.price >= bestSell.price) {
                // Use a more balanced pricing mechanism
                // Seller gets their asking price, but not less than a fair market price
                const marketPrice = this.getCurrentPrice(ware);
                const fairPrice = Math.max(bestSell.price, marketPrice * 0.8); // At least 80% of market price
                const tradePrice = Math.min(bestBuy.price, fairPrice); // But not more than buyer is willing to pay
                
                const tradeQuantity = Math.min(bestBuy.qty, bestSell.qty);

                console.log(`🤝 Matching orders: Buy ${bestBuy.price.toFixed(2)} >= Sell ${bestSell.price.toFixed(2)}, Trade @ ${tradePrice.toFixed(2)}`);

                // Execute the trade
                const execution: TradeExecution = {
                    buyOrderId: bestBuy.id,
                    sellOrderId: bestSell.id,
                    ware: ware,
                    quantity: tradeQuantity,
                    price: tradePrice,
                    buyerId: bestBuy.stationId,
                    sellerId: bestSell.stationId,
                    timestamp: Date.now()
                };

                // Actually execute the trade with stations
                if (this.executeTradeWithStations(execution)) {
                    executions.push(execution);

                    // Update quantities
                    bestBuy.qty -= tradeQuantity;
                    bestSell.qty -= tradeQuantity;

                    // Remove fulfilled orders
                    if (bestBuy.qty <= 0) {
                        buyOrders.shift();
                    }
                    if (bestSell.qty <= 0) {
                        sellOrders.shift();
                    }

                    // Record the trade
                    this.recordTrade(execution);
                    this.updatePriceHistory(ware, tradePrice, tradeQuantity);
                } else {
                    // Trade failed, remove the orders that couldn't be fulfilled
                    console.log(`❌ Trade failed: ${execution.sellerId} selling ${execution.ware} to ${execution.buyerId}`);
                    buyOrders.shift();
                    sellOrders.shift();
                }
            } else {
                break;
            }
        }

        return executions;
    }

    private executeTradeWithStations(execution: TradeExecution): boolean {
        const buyer = this.stations.get(execution.buyerId);
        const seller = this.stations.get(execution.sellerId);

        if (!buyer || !seller) {
            console.log(`❌ Station not found for trade: buyer=${execution.buyerId}, seller=${execution.sellerId}`);
            return false;
        }

        // Check if seller has enough stock
        const sellerStock = seller.getStockLevel(execution.ware);
        if (sellerStock < execution.quantity) {
            console.log(`❌ ${execution.sellerId} doesn't have enough ${execution.ware}: has ${sellerStock}, needs ${execution.quantity}`);
            return false;
        }

        // Check if buyer has enough credits
        const totalCost = execution.price * execution.quantity;
        if (buyer.credits < totalCost) {
            console.log(`❌ ${execution.buyerId} doesn't have enough credits: has ${buyer.credits.toFixed(2)}, needs ${totalCost.toFixed(2)}`);
            return false;
        }

        // Execute the trade
        try {
            // Seller: remove stock, add credits
            seller.stock[execution.ware] = (seller.stock[execution.ware] || 0) - execution.quantity;
            seller.credits += totalCost;

            // Buyer: add stock, remove credits
            buyer.stock[execution.ware] = (buyer.stock[execution.ware] || 0) + execution.quantity;
            buyer.credits -= totalCost;

            // Notify stations about successful trade
            if (seller.onSuccessfulTrade) {
                seller.onSuccessfulTrade(execution, 'SELL');
            }
            if (buyer.onSuccessfulTrade) {
                buyer.onSuccessfulTrade(execution, 'BUY');
            }

            console.log(`🎉 TRADE EXECUTED: ${execution.sellerId} sold ${execution.quantity} ${execution.ware} to ${execution.buyerId} for ${execution.price.toFixed(2)} each (Total: ${totalCost.toFixed(2)})`);
            
            return true;
        } catch (error) {
            console.error('❌ Error executing trade:', error);
            return false;
        }
    }

    private recordTrade(execution: TradeExecution): void {
        const tradeRecord: TradeRecord = {
            time: execution.timestamp,
            from: execution.sellerId,
            to: execution.buyerId,
            ware: execution.ware,
            quantity: execution.quantity,
            price: execution.price
        };

        this.tradeHistory.push(tradeRecord);

        // Keep only last 100 trades
        if (this.tradeHistory.length > 100) {
            this.tradeHistory.shift();
        }
    }

    private updatePriceHistory(ware: string, price: number, volume: number): void {
        const history = this.priceHistory.get(ware);
        if (!history) return;

        const now = Date.now();
        history.prices.push({
            time: now,
            price: price,
            volume: volume
        });

        // Keep only last 100 price points
        if (history.prices.length > 100) {
            history.prices.shift();
        }

        history.currentPrice = price;
        
        // Calculate 24h volume
        const dayAgo = now - 24 * 60 * 60 * 1000;
        history.volume24h = history.prices
            .filter(p => p.time > dayAgo)
            .reduce((sum, p) => sum + p.volume, 0);
    }

    private updateMarketStats(ware: string): void {
        const orderBook = this.orderBooks.get(ware);
        const history = this.priceHistory.get(ware);
        const stats = this.marketStats.get(ware);

        if (!orderBook || !history || !stats) return;

        // Calculate supply and demand levels
        stats.supplyLevel = orderBook.sell.reduce((sum, order) => sum + order.qty, 0);
        stats.demandLevel = orderBook.buy.reduce((sum, order) => sum + order.qty, 0);

        // Calculate spread
        const bestBid = orderBook.buy.length > 0 ? orderBook.buy[0]!.price : 0;
        const bestAsk = orderBook.sell.length > 0 ? orderBook.sell[0]!.price : Infinity;
        stats.spread = bestAsk === Infinity ? 0 : bestAsk - bestBid;

        stats.currentPrice = history.currentPrice;
        stats.lastUpdateTime = Date.now();
    }

    // Public API methods
    getCurrentPrice(ware: string): number {
        const stats = this.marketStats.get(ware);
        return stats ? stats.currentPrice : this.getBasePrice(ware);
    }

    getMarketStats(ware: string): MarketStats | null {
        return this.marketStats.get(ware) || null;
    }

    getOrderBook(ware: string): OrderBook | null {
        return this.orderBooks.get(ware) || null;
    }

    getBestBidAsk(ware: string): { bid: number | null, ask: number | null } {
        const orderBook = this.orderBooks.get(ware);
        if (!orderBook) return { bid: null, ask: null };

        const bid = orderBook.buy.length > 0 ? orderBook.buy[0]!.price : null;
        const ask = orderBook.sell.length > 0 ? orderBook.sell[0]!.price : null;

        return { bid, ask };
    }

    getSupplyDemandRatio(ware: string): number {
        const stats = this.marketStats.get(ware);
        if (!stats || stats.demandLevel === 0) return 1;
        return stats.supplyLevel / stats.demandLevel;
    }

    getAllWares(): string[] {
        return Array.from(this.orderBooks.keys());
    }

    getRecentTrades(ware?: string, limit: number = 10): TradeRecord[] {
        let trades = this.tradeHistory;
        if (ware) {
            trades = trades.filter(trade => trade.ware === ware);
        }
        return trades.slice(-limit).reverse(); // Most recent first
    }
}