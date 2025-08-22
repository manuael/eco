import { World } from "./World.js";
import { Station } from "./Station.js";
import { Ship } from "./Ship.js";
import { AsteroidBelt } from "./Asteroidbelt.js";
import { Recipe } from "./Recipe.js";
import { Order } from "./Order.js";
import { MarketExchange } from "./MarketExchange.js";
// Game State
let world = new World();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas?.getContext('2d');
let isRunning = false;
let lastTime = 0;
let timeScale = 1;
function initializeGame() {
    const oreToIron = new Recipe('ore_to_iron', [], [{ ware: 'iron', qty: 5 }], 1, 0);
    const ironToSteel = new Recipe('iron_to_steel', [{ ware: 'iron', qty: 2 }], [{ ware: 'steel', qty: 1 }], 1, 0);
    const steelToShips = new Recipe('steel_to_ships', [{ ware: 'steel', qty: 5 }], [{ ware: 'ships', qty: 1 }], 5, 0);
    const miningStation = new Station('mine1', 'Iron Mine', [100, 100], 'mine');
    miningStation.addRecipe(oreToIron);
    //miningStation.addStock('iron', 50);
    const steelMill = new Station('mill1', 'Steel Mill 1', [300, 200], 'factory');
    steelMill.addRecipe(ironToSteel);
    //steelMill.addStock('iron', 20);
    const steelMill1 = new Station('mill2', 'Steel Mill 2', [300, 300], 'factory');
    steelMill1.addRecipe(ironToSteel);
    const steelMill2 = new Station('mill3', 'Steel Mill 3', [300, 400], 'factory');
    steelMill2.addRecipe(ironToSteel);
    const shipyard = new Station('shipyard1', 'Shipyard', [500, 350], 'factory');
    shipyard.addRecipe(steelToShips);
    //shipyard.addStock('steel', 10);
    world = new World();
    // Use addStation to ensure market integration
    world.addStation(miningStation);
    world.addStation(steelMill);
    world.addStation(steelMill1);
    world.addStation(steelMill2);
    world.addStation(shipyard);
    // world.ships.push(
    //     new Ship('trader1', 'TRADER', [150, 150]),
    //     new Ship('miner1', 'MINER', [120, 120]),
    //     new Ship('trader2', 'TRADER', [400, 300])
    // );
    // Add asteroid belts for mining
    // world.asteroidBelts.push(
    //     new AsteroidBelt('belt1', 'iron', [50, 50], 1000),
    //     new AsteroidBelt('belt2', 'iron', [700, 100], 800)
    // );
}
// Rendering
function render() {
    if (!canvas || !ctx)
        return;
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
        ctx.fillText(`${belt.type} (${Math.floor(belt.quantity)})`, belt.location[0] - 30, belt.location[1] + size + 15);
    });
    // Draw stations
    world.stations.forEach(station => {
        const size = 25;
        let color = '#FFD700'; // Default gold
        switch (station.type) {
            case 'mine':
                color = '#8B4513';
                break;
            case 'factory':
                color = '#4169E1';
                break;
            case 'trade':
                color = '#32CD32';
                break;
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
        }
        else {
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
function updateInfoPanel() {
    // Market Statistics
    const marketInfo = document.getElementById('marketInfo');
    if (marketInfo) {
        const wares = world.market.getAllWares();
        marketInfo.innerHTML = wares.map(ware => {
            const stats = world.market.getMarketStats(ware);
            const { bid, ask } = world.market.getBestBidAsk(ware);
            if (!stats)
                return '';
            return `<div class="item market-ware">
                <strong>${ware.toUpperCase()}</strong><br>
                Price: ${stats.currentPrice.toFixed(2)}<br>
                Bid/Ask: ${bid?.toFixed(2) || 'N/A'} / ${ask?.toFixed(2) || 'N/A'}<br>
                Supply: ${stats.supplyLevel} | Demand: ${stats.demandLevel}<br>
                Volume: ${stats.volume}<br>
                ${stats.spread > 0 ? `Spread: ${stats.spread.toFixed(2)}` : ''}
            </div>`;
        }).join('');
    }
    // Active Orders
    const orderInfo = document.getElementById('orderInfo');
    if (orderInfo) {
        const allOrders = [];
        world.market.getAllWares().forEach(ware => {
            const orderBook = world.market.getOrderBook(ware);
            if (orderBook) {
                orderBook.buy.slice(0, 3).forEach(order => {
                    allOrders.push({
                        ware,
                        side: 'BUY',
                        price: order.price,
                        qty: order.qty,
                        station: order.stationId
                    });
                });
                orderBook.sell.slice(0, 3).forEach(order => {
                    allOrders.push({
                        ware,
                        side: 'SELL',
                        price: order.price,
                        qty: order.qty,
                        station: order.stationId
                    });
                });
            }
        });
        if (allOrders.length > 0) {
            orderInfo.innerHTML = allOrders.map(order => `<div class="item order-${order.side.toLowerCase()}">
                    <strong>${order.side}</strong> ${order.ware}<br>
                    ${order.qty} @ ${order.price.toFixed(2)}<br>
                    <small>${order.station}</small>
                </div>`).join('');
        }
        else {
            orderInfo.innerHTML = '<div class="item">No active orders</div>';
        }
    }
    // Stations
    const stationInfo = document.getElementById('stationInfo');
    if (stationInfo) {
        stationInfo.innerHTML = world.stations.map(station => `<div class="item station">
                <strong>${station.name}</strong><br>
                Credits: ${station.credits.toFixed(0)}<br>
                Stock: ${Object.entries(station.stock).map(([ware, qty]) => `${ware}: ${qty}`).join(', ') || 'Empty'}<br>
                Orders: ${station.orders.length}<br>
                ${station.productionTimer > 0 ? `Producing... (${station.productionTimer.toFixed(1)}s)` : 'Idle'}
            </div>`).join('');
    }
    // Ships
    const shipInfo = document.getElementById('shipInfo');
    if (shipInfo) {
        shipInfo.innerHTML = world.ships.map(ship => `<div class="item ${ship.type.toLowerCase()}">
                <strong>${ship.id}</strong> (${ship.type})<br>
                Status: ${ship.state}<br>
                Cargo: ${ship.getCurrentCargo()}/${ship.cargoCap}<br>
                ${Object.entries(ship.cargo).map(([ware, qty]) => `${ware}: ${qty}`).join(', ') || 'Empty'}
            </div>`).join('');
    }
    // Trade Activity
    const tradeInfo = document.getElementById('tradeInfo');
    if (tradeInfo) {
        tradeInfo.innerHTML = world.tradeLog.slice(-5).reverse().map(trade => `<div class="item">
                ${trade.from} → ${trade.to}<br>
                ${trade.ware}: ${trade.quantity} @ ${trade.price.toFixed(2)}
            </div>`).join('') || '<div class="item">No recent trades</div>';
    }
    // Resources
    const totalResources = {};
    world.stations.forEach(station => {
        Object.entries(station.stock).forEach(([ware, qty]) => {
            totalResources[ware] = (totalResources[ware] || 0) + qty;
        });
    });
    const resourceInfo = document.getElementById('resourceInfo');
    if (resourceInfo) {
        resourceInfo.innerHTML = Object.entries(totalResources).map(([ware, qty]) => `<div class="item">${ware}: ${qty}</div>`).join('') || '<div class="item">No resources</div>';
    }
}
// Game Loop
function gameLoop(currentTime) {
    if (isRunning) {
        const deltaTime = (currentTime - lastTime) / 1000 * timeScale;
        if (deltaTime < 0.1) { // Prevent huge jumps
            world.update(deltaTime);
            // Add this line to handle market cleanup
            world.market.update();
            updateInfoPanel();
        }
        render();
    }
    lastTime = currentTime;
    requestAnimationFrame(gameLoop);
}
// Controls
function toggleSimulation() {
    console.log("START SIM");
    isRunning = !isRunning;
}
function resetSimulation() {
    initializeGame();
    isRunning = false;
}
function addRandomShip() {
    const types = ['TRADER', 'MINER'];
    const type = types[Math.floor(Math.random() * types.length)];
    if (!type || !canvas)
        return;
    const id = `${type.toLowerCase()}${world.ships.length + 1}`;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    world.ships.push(new Ship(id, type, [x, y]));
}
function speedUp() {
    timeScale = timeScale >= 4 ? 1 : timeScale * 2;
}
// Initialize and start
initializeGame();
requestAnimationFrame(gameLoop);
// Make functions available globally for HTML onclick handlers
window.toggleSimulation = toggleSimulation;
window.resetSimulation = resetSimulation;
window.addRandomShip = addRandomShip;
window.speedUp = speedUp;
// Click handler for canvas interaction
if (canvas) {
    canvas.addEventListener('click', (e) => {
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
//# sourceMappingURL=index.js.map