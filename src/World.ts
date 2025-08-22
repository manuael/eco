import { Station } from "./Station.js";
import { Ship } from "./Ship.js";
import { AsteroidBelt } from "./Asteroidbelt.js";
import { Recipe } from "./Recipe.js";
import type { OrderBook, TradeRecord } from "./interfaces.js";

export class World {
    public stations: Station[];
    public ships: Ship[];
    public asteroidBelts: AsteroidBelt[];
    public recipes: Recipe[];
    public orderBook: OrderBook;
    public tradeLog: TradeRecord[];
    public time: number;

    constructor() {
        this.stations = [];
        this.ships = [];
        this.asteroidBelts = [];
        this.recipes = [];
        this.orderBook = { buy: [], sell: [] };
        this.tradeLog = [];
        this.time = 0;
    }

    update(deltaTime: number): void {
        this.time += deltaTime;

        this.stations.forEach(station => station.update(deltaTime));
        this.ships.forEach(ship => ship.update(deltaTime));

        // Simple AI for ships
        this.ships.forEach(ship => {
            if (ship.state === 'idle') {
                this.assignShipTask(ship);
            }
        });
    }

    assignShipTask(ship: Ship): void {
        if (ship.type === 'MINER') {
            // Find nearest asteroid belt
            const belt = this.asteroidBelts.find(b => b.quantity > 0);
            if (belt && ship.getCurrentCargo() < ship.cargoCap * 0.8) {
                // Move to belt and then start mining
                ship.moveTo(belt.location, {
                    state: 'mining',
                    timer: 2 + Math.random() * 3
                });
            } else {
                // Return to nearest station
                const station = this.findNearestStation(ship.location);
                if (station) {
                    ship.moveTo(station.location, {
                        state: 'trading',
                        timer: 1
                    });
                }
            }
        } else if (ship.type === 'TRADER') {
            // Find trade opportunities
            const stations = this.stations.filter(s => s.type === 'factory');
            if (stations.length >= 2) {
                const randomStation = stations[Math.floor(Math.random() * stations.length)];
                if (randomStation) {
                    ship.moveTo(randomStation.location, {
                        state: 'trading',
                        timer: 1 + Math.random() * 2
                    });
                }
            }
        }
    }

    findNearestStation(location: [number, number]): Station | null {
        let nearest: Station | null = null;
        let minDistance = Infinity;

        this.stations.forEach(station => {
            const dx = station.location[0] - location[0];
            const dy = station.location[1] - location[1];
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = station;
            }
        });

        return nearest;
    }

    addTrade(from: string, to: string, ware: string, quantity: number, price: number): void {
        this.tradeLog.push({
            time: this.time,
            from: from,
            to: to,
            ware: ware,
            quantity: quantity,
            price: price
        });

        // Keep only last 10 trades
        if (this.tradeLog.length > 10) {
            this.tradeLog.shift();
        }
    }
}