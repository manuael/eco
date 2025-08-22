import { World } from "./World.js";
import { Station } from "./Station.js";
import { Ship } from "./Ship.js";
import { AsteroidBelt } from "./Asteroidbelt.js";
import { Recipe } from "./Recipe.js";
import type { Stock, ShipType } from "./interfaces.js";

// Game State
let world = new World();
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas?.getContext('2d');
let isRunning = false;
let lastTime = 0;
let timeScale = 1;

function initializeGame(): void {
    const ironToSteel = new Recipe('iron_to_steel',
        [{ ware: 'iron', qty: 2 }],
        [{ ware: 'steel', qty: 1 }],
        3, 1);

    const steelToShips = new Recipe('steel_to_ships',
        [{ ware: 'steel', qty: 5 }],
        [{ ware: 'ships', qty: 1 }],
        5, 2);

    
    const miningStation = new Station('mine1', 'Iron Mine', [100, 100], 'mine');
    miningStation.addStock('iron', 50);

    const steelMill = new Station('mill1', 'Steel Mill', [300, 200], 'factory');
    steelMill.addRecipe(ironToSteel);
    steelMill.addStock('iron', 20);

    const shipyard = new Station('shipyard1', 'Shipyard', [500, 350], 'factory');
    shipyard.addRecipe(steelToShips);
    shipyard.addStock('steel', 10);

    const tradingPost = new Station('trade1', 'Trading Post', [200, 400], 'trade');
    tradingPost.addStock('iron', 30);
    tradingPost.addStock('steel', 15);

    
    world = new World();
    world.stations.push(miningStation, steelMill, shipyard, tradingPost);
    world.ships.push(
        new Ship('trader1', 'TRADER', [150, 150]),
        new Ship('miner1', 'MINER', [120, 120]),
        new Ship('trader2', 'TRADER', [400, 300])
    );
    world.asteroidBelts.push(
        new AsteroidBelt('belt1', 'iron', [600, 100], 500),
        new AsteroidBelt('belt2', 'copper', [700, 450], 300)
    );
}

// Rendering
function render(): void {
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections between stations
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < world.stations.length; i++) {
        for (let j = i + 1; j < world.stations.length; j++) {
            const station1 = world.stations[i];
            const station2 = world.stations[j];
            if (station1 && station2) {
                ctx.beginPath();
                ctx.moveTo(station1.location[0], station1.location[1]);
                ctx.lineTo(station2.location[0], station2.location[1]);
                ctx.stroke();
            }
        }
    }

    // Draw asteroid belts
    world.asteroidBelts.forEach(belt => {
        const size = Math.max(10, (belt.quantity / belt.maxQuantity) * 30);
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(belt.location[0], belt.location[1], size, 0, Math.PI * 2);
        ctx.fill();

        // Belt label
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText(`${belt.type} (${Math.floor(belt.quantity)})`,
            belt.location[0] - 30, belt.location[1] + size + 15);
    });

    // Draw stations
    world.stations.forEach(station => {
        const size = 25;
        let color = '#FFD700'; // Default gold

        switch (station.type) {
            case 'mine': color = '#8B4513'; break;
            case 'factory': color = '#4169E1'; break;
            case 'trade': color = '#32CD32'; break;
        }

        // Station building
        ctx.fillStyle = color;
        ctx.fillRect(station.location[0] - size / 2, station.location[1] - size / 2, size, size);

        // Station border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(station.location[0] - size / 2, station.location[1] - size / 2, size, size);

        // Station name
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(station.name, station.location[0], station.location[1] - 35);

        // Production indicator
        if (station.productionTimer > 0) {
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(station.location[0] + 15, station.location[1] - 15, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw ships
    world.ships.forEach(ship => {
        const size = 8;
        let color = ship.type === 'TRADER' ? '#00BFFF' : '#FF6347';

        // Ship body
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ship.type === 'TRADER') {
            ctx.arc(ship.location[0], ship.location[1], size, 0, Math.PI * 2);
        } else {
            // Triangle for miner
            ctx.moveTo(ship.location[0], ship.location[1] - size);
            ctx.lineTo(ship.location[0] - size, ship.location[1] + size);
            ctx.lineTo(ship.location[0] + size, ship.location[1] + size);
            ctx.closePath();
        }
        ctx.fill();

        // Ship outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw target line
        if (ship.target) {
            ctx.strokeStyle = color;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(ship.location[0], ship.location[1]);
            ctx.lineTo(ship.target[0], ship.target[1]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Ship ID
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ship.id, ship.location[0], ship.location[1] + 20);
    });
}

// Update Info Panel
function updateInfoPanel(): void {
    // Stations
    const stationInfo = document.getElementById('stationInfo');
    if (stationInfo) {
        stationInfo.innerHTML = world.stations.map(station =>
            `<div class="item station">
                    <strong>${station.name}</strong><br>
                    Credits: ${station.credits}<br>
                    Stock: ${Object.entries(station.stock).map(([ware, qty]) => `${ware}: ${qty}`).join(', ') || 'Empty'}<br>
                    ${station.productionTimer > 0 ? `Producing... (${station.productionTimer.toFixed(1)}s)` : 'Idle'}
                </div>`
        ).join('');
    }

    // Ships
    const shipInfo = document.getElementById('shipInfo');
    if (shipInfo) {
        shipInfo.innerHTML = world.ships.map(ship =>
            `<div class="item ${ship.type.toLowerCase()}">
                    <strong>${ship.id}</strong> (${ship.type})<br>
                    Status: ${ship.state}<br>
                    Cargo: ${ship.getCurrentCargo()}/${ship.cargoCap}<br>
                    ${Object.entries(ship.cargo).map(([ware, qty]) => `${ware}: ${qty}`).join(', ') || 'Empty'}
                </div>`
        ).join('');
    }

    // Trade Activity
    const tradeInfo = document.getElementById('tradeInfo');
    if (tradeInfo) {
        tradeInfo.innerHTML = world.tradeLog.slice(-5).reverse().map(trade =>
            `<div class="item">
                    ${trade.from} → ${trade.to}<br>
                    ${trade.ware}: ${trade.quantity} @ ${trade.price}
                </div>`
        ).join('') || '<div class="item">No recent trades</div>';
    }

    // Resources
    const totalResources: Stock = {};
    world.stations.forEach(station => {
        Object.entries(station.stock).forEach(([ware, qty]) => {
            totalResources[ware] = (totalResources[ware] || 0) + qty;
        });
    });

    const resourceInfo = document.getElementById('resourceInfo');
    if (resourceInfo) {
        resourceInfo.innerHTML = Object.entries(totalResources).map(([ware, qty]) =>
            `<div class="item">${ware}: ${qty}</div>`
        ).join('') || '<div class="item">No resources</div>';
    }
}

// Game Loop
function gameLoop(currentTime: number): void {
    if (isRunning) {
        const deltaTime = (currentTime - lastTime) / 1000 * timeScale;

        if (deltaTime < 0.1) { // Prevent huge jumps
            world.update(deltaTime);
            updateInfoPanel();
        }

        render();
    }

    lastTime = currentTime;
    requestAnimationFrame(gameLoop);
}

// Controls
function toggleSimulation(): void {
    console.log("START SIM")
    isRunning = !isRunning;
}

function resetSimulation(): void {
    initializeGame();
    isRunning = false;
}

function addRandomShip(): void {
    const types: ShipType[] = ['TRADER', 'MINER'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    if (!type || !canvas) return;
    
    const id = `${type.toLowerCase()}${world.ships.length + 1}`;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;

    world.ships.push(new Ship(id, type, [x, y]));
}

function speedUp(): void {
    timeScale = timeScale >= 4 ? 1 : timeScale * 2;
}

// Initialize and start
initializeGame();
requestAnimationFrame(gameLoop);

// Make functions available globally for HTML onclick handlers
(window as any).toggleSimulation = toggleSimulation;
(window as any).resetSimulation = resetSimulation;
(window as any).addRandomShip = addRandomShip;
(window as any).speedUp = speedUp;

// Click handler for canvas interaction
if (canvas) {
    canvas.addEventListener('click', (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find clicked object
        const clickedStation = world.stations.find(station => {
            const dx = station.location[0] - x;
            const dy = station.location[1] - y;
            return Math.sqrt(dx * dx + dy * dy) < 25;
        });

        if (clickedStation) {
            console.log('Clicked station:', clickedStation.name);
            // You could add station interaction here
        }
    });
}