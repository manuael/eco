import { Order } from "./Order.js";
import { Recipe } from "./Recipe.js";
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
    constructor(id, name, location, type = 'factory') {
        this.id = id;
        this.name = name;
        this.location = location;
        this.type = type;
        this.stock = {};
        this.credits = 1000;
        this.recipes = [];
        this.productionQueue = [];
        this.storageCapacity = 1000;
        this.productionTimer = 0;
        this.orders = [];
    }
    addRecipe(recipe) {
        this.recipes.push(recipe);
    }
    update(deltaTime) {
        // Production logic
        if (this.recipes.length > 0 && this.productionTimer <= 0) {
            const recipe = this.recipes[0]; // Simple: use first recipe
            if (recipe && recipe.canProduce(this.stock)) {
                // Consume inputs
                recipe.inputs.forEach(input => {
                    this.stock[input.ware] = (this.stock[input.ware] || 0) - input.qty;
                });
                // Start production
                this.productionTimer = recipe.duration;
                this.productionQueue.push(recipe);
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
                }
            }
        }
    }
    addStock(ware, quantity) {
        this.stock[ware] = (this.stock[ware] || 0) + quantity;
    }
}
//# sourceMappingURL=Station.js.map