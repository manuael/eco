import { Order } from "./Order.js";
import { Recipe } from "./Recipe.js";
import type { Stock } from "./interfaces.js";

type StationType = 'factory' | 'mine' | 'trade';

export class Station {
    public id: string;
    public name: string;
    public location: [number, number];
    public type: StationType;
    public stock: Stock;
    public credits: number;
    public recipes: Recipe[];
    public productionQueue: Recipe[];
    public storageCapacity: number;
    public productionTimer: number;
    public orders: Order[];

    constructor(id: string, name: string, location: [number, number], type: StationType = 'factory') {
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

    addRecipe(recipe: Recipe): void {
        this.recipes.push(recipe);
    }

    update(deltaTime: number): void {
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

    addStock(ware: string, quantity: number): void {
        this.stock[ware] = (this.stock[ware] || 0) + quantity;
    }
}