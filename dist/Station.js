import { Order } from "./Order.js";
import { Recipe } from "./Recipe.js";
import { MarketExchange } from "./MarketExchange.js";
export class Station {
    id;
    name;
    location;
    type;
    stock;
    credits;
    recipes;
    productionQueue;
    storageCapacity;
    productionTimer;
    orders;
    marketConfig;
    market = null;
    lastMarketUpdate = 0;
    marketUpdateInterval = 8000; // 8 seconds
    priceMemory = new Map();
    constructor(id, name, location, type = 'factory') {
        this.id = id;
        this.name = name;
        this.location = location;
        this.type = type;
        this.stock = {};
        this.credits = 1000;
        this.recipes = [];
        this.productionQueue = [];
        this.storageCapacity = 50;
        this.productionTimer = 0;
        this.orders = [];
        // Enhanced market configuration
        this.marketConfig = {
            minStockThreshold: 0.15, // 15% of capacity
            maxStockThreshold: 0.75, // 75% of capacity
            urgencyMultiplier: 1.8,
            profitMargin: 0.2, // 20% profit margin
            maxOrderSize: 15,
            priceTolerancePercent: 0.1, // 10% tolerance
            orderLifetime: 10000, // 10 seconds
            priceAdjustmentRate: 0.05, // 5% price adjustment
            minPriceMultiplier: 1.2 // Minimum 120% of base production cost
        };
    }
    setMarket(market) {
        this.market = market;
        market.registerStation(this);
    }
    initializePriceMemory(ware) {
        if (!this.priceMemory.has(ware)) {
            const basePrice = this.market?.getCurrentPrice(ware) || 50;
            this.priceMemory.set(ware, {
                ware,
                lastSellPrice: basePrice,
                lastBuyPrice: basePrice,
                successfulSells: 0,
                successfulBuys: 0,
                expiredSellOrders: 0,
                expiredBuyOrders: 0,
                lastTradeTime: 0
            });
        }
    }
    addRecipe(recipe) {
        this.recipes.push(recipe);
    }
    update(deltaTime) {
        // Production logic
        this.handleProduction(deltaTime);
        // Market operations
        if (this.market && Date.now() - this.lastMarketUpdate > this.marketUpdateInterval) {
            this.updateMarketOrders();
            this.lastMarketUpdate = Date.now();
        }
        // Update market cleanup
        if (this.market) {
            this.market.update();
        }
    }
    handleProduction(deltaTime) {
        // Try to start production
        if (this.recipes.length > 0 && this.productionTimer <= 0) {
            for (const recipe of this.recipes) {
                if (recipe && recipe.canProduce(this.stock)) {
                    // Consume inputs
                    recipe.inputs.forEach(input => {
                        this.stock[input.ware] = (this.stock[input.ware] || 0) - input.qty;
                    });
                    // Start production
                    this.productionTimer = recipe.duration;
                    this.productionQueue.push(recipe);
                    console.log(`🏭 ${this.name} started producing ${recipe.outputs.map(o => o.ware).join(', ')}`);
                    break;
                }
            }
        }
        // Complete production
        if (this.productionTimer > 0) {
            this.productionTimer -= deltaTime;
            if (this.productionTimer <= 0) {
                const completedRecipe = this.productionQueue.shift();
                if (completedRecipe) {
                    completedRecipe.outputs.forEach(output => {
                        this.stock[output.ware] = (this.stock[output.ware] || 0) + output.qty;
                    });
                    console.log(`✅ ${this.name} completed production: ${completedRecipe.outputs.map(o => `${o.qty} ${o.ware}`).join(', ')}`);
                }
            }
        }
    }
    updateMarketOrders() {
        if (!this.market)
            return;
        // Clear old orders
        this.orders = [];
        // Generate buy orders for needed inputs
        this.recipes.forEach(recipe => {
            recipe.inputs.forEach(input => {
                this.initializePriceMemory(input.ware);
                const currentStock = this.stock[input.ware] || 0;
                const threshold = this.storageCapacity * this.marketConfig.minStockThreshold;
                if (currentStock < threshold) {
                    const buyPrice = this.calculateAdaptiveBuyPrice(input.ware);
                    const quantity = Math.min(this.marketConfig.maxOrderSize, Math.ceil((threshold - currentStock) * 1.5));
                    if (quantity > 0 && this.credits >= buyPrice * quantity) {
                        const order = new Order(`${this.id}_buy_${input.ware}_${Date.now()}`, this.id, input.ware, 'BUY', quantity, buyPrice, this.marketConfig.orderLifetime);
                        this.market.addOrder(order);
                        this.orders.push(order);
                        console.log(`📈 ${this.name} placed BUY order: ${quantity} ${input.ware} @ ${buyPrice.toFixed(2)}`);
                    }
                }
            });
        });
        // Generate sell orders for excess outputs
        Object.keys(this.stock).forEach(ware => {
            this.initializePriceMemory(ware);
            const currentStock = this.stock[ware] || 0;
            const threshold = this.storageCapacity * this.marketConfig.maxStockThreshold;
            if (currentStock > threshold) {
                const sellPrice = this.calculateAdaptiveSellPrice(ware);
                const quantity = Math.min(this.marketConfig.maxOrderSize, Math.floor(currentStock - threshold));
                if (quantity > 0) {
                    const order = new Order(`${this.id}_sell_${ware}_${Date.now()}`, this.id, ware, 'SELL', quantity, sellPrice, this.marketConfig.orderLifetime);
                    this.market.addOrder(order);
                    this.orders.push(order);
                    console.log(`📉 ${this.name} placed SELL order: ${quantity} ${ware} @ ${sellPrice.toFixed(2)}`);
                }
            }
        });
    }
    calculateAdaptiveBuyPrice(ware) {
        const memory = this.priceMemory.get(ware);
        const marketPrice = this.market.getCurrentPrice(ware);
        const basePrice = memory.lastBuyPrice || marketPrice;
        // Start with market price as baseline
        let adjustedPrice = marketPrice;
        // Adjust based on recent success/failure
        const totalAttempts = memory.successfulBuys + memory.expiredBuyOrders;
        if (totalAttempts > 0) {
            const successRate = memory.successfulBuys / totalAttempts;
            if (successRate > 0.7) {
                // Very successful, try to buy cheaper
                adjustedPrice *= (1 - this.marketConfig.priceAdjustmentRate);
            }
            else if (successRate < 0.3) {
                // Many failures, need to pay more
                adjustedPrice *= (1 + this.marketConfig.priceAdjustmentRate * 2);
            }
        }
        // Apply urgency based on stock levels
        const currentStock = this.stock[ware] || 0;
        const threshold = this.storageCapacity * this.marketConfig.minStockThreshold;
        const urgency = threshold > 0 ? Math.max(0, (threshold - currentStock) / threshold) : 0;
        adjustedPrice *= (1 + urgency * this.marketConfig.urgencyMultiplier * 0.1);
        // Ensure reasonable bounds
        const minPrice = marketPrice * 0.7; // Don't go below 70% of market price
        const maxPrice = marketPrice * 2.0; // Don't go above 200% of market price
        return Math.max(minPrice, Math.min(maxPrice, adjustedPrice));
    }
    calculateAdaptiveSellPrice(ware) {
        const memory = this.priceMemory.get(ware);
        const marketPrice = this.market.getCurrentPrice(ware);
        const productionCost = this.getProductionCost(ware);
        const minPrice = productionCost * this.marketConfig.minPriceMultiplier;
        // Start with desired profit margin
        let adjustedPrice = Math.max(minPrice, productionCost * (1 + this.marketConfig.profitMargin));
        // Adjust based on recent success/failure
        const totalAttempts = memory.successfulSells + memory.expiredSellOrders;
        if (totalAttempts > 0) {
            const successRate = memory.successfulSells / totalAttempts;
            if (successRate > 0.7) {
                // Very successful, try to sell higher
                adjustedPrice *= (1 + this.marketConfig.priceAdjustmentRate);
            }
            else if (successRate < 0.3) {
                // Many failures, need to lower price
                adjustedPrice *= (1 - this.marketConfig.priceAdjustmentRate);
            }
        }
        // Apply market pressure
        if (adjustedPrice > marketPrice * 1.3) {
            adjustedPrice = marketPrice * 1.2; // Don't price too far above market
        }
        // Ensure we don't go below minimum viable price
        return Math.max(minPrice, adjustedPrice);
    }
    getProductionCost(ware) {
        // Find recipe that produces this ware
        for (const recipe of this.recipes) {
            const output = recipe.outputs.find(o => o.ware === ware);
            if (output && this.market) {
                // Calculate input costs
                const inputCost = recipe.inputs.reduce((total, input) => {
                    return total + (this.market.getCurrentPrice(input.ware) * input.qty);
                }, 0);
                // Add production time cost
                const timeCost = recipe.duration * 0.5;
                return (inputCost + timeCost) / output.qty;
            }
        }
        // For raw materials (like iron from mines), use a base cost
        if (this.type === 'mine') {
            return this.market ? this.market.getCurrentPrice(ware) * 0.4 : 5; // 40% of market price as extraction cost
        }
        return this.market ? this.market.getCurrentPrice(ware) * 0.8 : 40;
    }
    // Called by market when order expires
    onOrderExpired(order) {
        const memory = this.priceMemory.get(order.ware);
        if (memory) {
            if (order.side === 'BUY') {
                memory.expiredBuyOrders++;
                console.log(`📊 ${this.name}: Buy order expired for ${order.ware} (${memory.expiredBuyOrders} total failed)`);
            }
            else {
                memory.expiredSellOrders++;
                console.log(`📊 ${this.name}: Sell order expired for ${order.ware} (${memory.expiredSellOrders} total failed)`);
            }
        }
    }
    // Called by market when trade succeeds
    onSuccessfulTrade(execution, side) {
        const memory = this.priceMemory.get(execution.ware);
        if (memory) {
            memory.lastTradeTime = execution.timestamp;
            if (side === 'BUY') {
                memory.successfulBuys++;
                memory.lastBuyPrice = execution.price;
                console.log(`📊 ${this.name}: Successful buy of ${execution.ware} at ${execution.price.toFixed(2)} (${memory.successfulBuys} total success)`);
            }
            else {
                memory.successfulSells++;
                memory.lastSellPrice = execution.price;
                console.log(`📊 ${this.name}: Successful sell of ${execution.ware} at ${execution.price.toFixed(2)} (${memory.successfulSells} total success)`);
            }
        }
    }
    addStock(ware, quantity) {
        this.stock[ware] = (this.stock[ware] || 0) + quantity;
    }
    getStockLevel(ware) {
        return this.stock[ware] || 0;
    }
    getStockPercentage(ware) {
        return this.getStockLevel(ware) / this.storageCapacity;
    }
}
//# sourceMappingURL=Station.js.map