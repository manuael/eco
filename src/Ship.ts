import type { ShipType, ShipState, NextAction, Stock } from "./interfaces.js";

export class Ship {
    public id: string;
    public type: ShipType;
    public location: [number, number];
    public target: [number, number] | null;
    public cargoCap: number;
    public cargo: Stock;
    public speed: number;
    public state: ShipState;
    public actionTimer: number;
    public nextAction: NextAction | null;

    constructor(id: string, type: ShipType, location: [number, number], cargoCap: number = 100) {
        this.id = id;
        this.type = type;
        this.location = [...location] as [number, number];
        this.target = null;
        this.cargoCap = cargoCap;
        this.cargo = {};
        this.speed = 50; // pixels per second
        this.state = 'idle';
        this.actionTimer = 0;
        this.nextAction = null;
    }

    update(deltaTime: number): void {
        if (this.target && this.state === 'moving') {
            const dx = this.target[0] - this.location[0];
            const dy = this.target[1] - this.location[1];
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                this.location = [...this.target] as [number, number];
                this.target = null;

                // Execute the next action when reaching destination
                if (this.nextAction) {
                    this.state = this.nextAction.state;
                    this.actionTimer = this.nextAction.timer;
                    this.nextAction = null;
                } else {
                    this.state = 'idle';
                }
            } else {
                const moveDistance = this.speed * deltaTime;
                this.location[0] += (dx / distance) * moveDistance;
                this.location[1] += (dy / distance) * moveDistance;
            }
        }

        // Action timer
        if (this.actionTimer > 0) {
            this.actionTimer -= deltaTime;
            if (this.actionTimer <= 0) {
                this.completeAction();
            }
        }
    }

    moveTo(target: [number, number], nextAction: NextAction | null = null): void {
        this.target = [...target] as [number, number];
        this.state = 'moving';
        this.nextAction = nextAction;
    }

    completeAction(): void {
        if (this.type === 'MINER' && this.state === 'mining') {
            this.cargo['ore'] = (this.cargo['ore'] || 0) + 10;
            this.state = 'idle';
        } else if (this.type === 'TRADER' && this.state === 'trading') {
            // Complete trade
            this.state = 'idle';
        }
    }

    getCurrentCargo(): number {
        return Object.values(this.cargo).reduce((sum: number, qty: number) => sum + qty, 0);
    }
}