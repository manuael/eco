export class Ship {
    id;
    type;
    location;
    target;
    cargoCap;
    cargo;
    speed;
    state;
    actionTimer;
    nextAction;
    constructor(id, type, location, cargoCap = 100) {
        this.id = id;
        this.type = type;
        this.location = [...location];
        this.target = null;
        this.cargoCap = cargoCap;
        this.cargo = {};
        this.speed = 50; // pixels per second
        this.state = 'idle';
        this.actionTimer = 0;
        this.nextAction = null;
    }
    update(deltaTime) {
        if (this.target && this.state === 'moving') {
            const dx = this.target[0] - this.location[0];
            const dy = this.target[1] - this.location[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 5) {
                this.location = [...this.target];
                this.target = null;
                // Execute the next action when reaching destination
                if (this.nextAction) {
                    this.state = this.nextAction.state;
                    this.actionTimer = this.nextAction.timer;
                    this.nextAction = null;
                }
                else {
                    this.state = 'idle';
                }
            }
            else {
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
    moveTo(target, nextAction = null) {
        this.target = [...target];
        this.state = 'moving';
        this.nextAction = nextAction;
    }
    completeAction() {
        if (this.type === 'MINER' && this.state === 'mining') {
            this.cargo['ore'] = (this.cargo['ore'] || 0) + 10;
            this.state = 'idle';
        }
        else if (this.type === 'TRADER' && this.state === 'trading') {
            // Complete trade
            this.state = 'idle';
        }
    }
    getCurrentCargo() {
        return Object.values(this.cargo).reduce((sum, qty) => sum + qty, 0);
    }
}
//# sourceMappingURL=Ship.js.map