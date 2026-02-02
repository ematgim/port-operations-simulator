// Configuration
const API_URL = 'http://localhost:3000';

const PORT_SIZE = 1000;
const GRID_SIZE = 100;

// State
let tugboats = new Map();
let vessels = new Map();
let eventSource = null;
let canvas, ctx;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('port-map');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setupCanvasInteraction();
    setupControls();
    connectToStream();
    
    // Start render loop
    requestAnimationFrame(render);
});

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Center view
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    scale = Math.min(canvasWidth, canvasHeight) / (PORT_SIZE * 1.2);
    offsetX = (canvasWidth - PORT_SIZE * scale) / 2;
    offsetY = (canvasHeight - PORT_SIZE * scale) / 2;
}

function setupCanvasInteraction() {
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            offsetX += dx;
            offsetY += dy;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Zoom towards mouse position
        offsetX = mouseX - (mouseX - offsetX) * delta;
        offsetY = mouseY - (mouseY - offsetY) * delta;
        scale *= delta;
    });
}

function setupControls() {
    document.getElementById('zoom-in').addEventListener('click', () => {
        scale *= 1.2;
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        scale *= 0.8;
    });
    
    document.getElementById('reset-view').addEventListener('click', () => {
        resizeCanvas();
    });
}

function connectToStream() {
    eventSource = new EventSource(`${API_URL}/api/stream`);
    
    eventSource.onopen = () => {
        console.log('Connected to stream');
        updateConnectionStatus(true);
    };
    
    eventSource.onerror = () => {
        console.error('Stream connection error');
        updateConnectionStatus(false);
        
        // Reconnect after 5 seconds
        setTimeout(() => {
            eventSource.close();
            connectToStream();
        }, 5000);
    };
    
    eventSource.onmessage = (event) => {
        try {
            const update = JSON.parse(event.data);
            handleUpdate(update);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    };
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('connection-status');
    const text = document.getElementById('status-text');
    
    if (connected) {
        indicator.className = 'status-indicator connected';
        text.textContent = 'Connected';
    } else {
        indicator.className = 'status-indicator disconnected';
        text.textContent = 'Disconnected';
    }
}

function handleUpdate(update) {
    switch(update.type) {
        case 'SNAPSHOT':
            update.data.tugboats.forEach(t => updateTugboat(t));
            update.data.vessels.forEach(v => updateVessel(v));
            break;
        case 'TUGBOAT_POSITION':
            updateTugboat(update.data);
            break;
        case 'VESSEL_REQUEST':
        case 'VESSEL_ARRIVED':
            updateVessel(update.data);
            break;
        case 'VESSEL_DOCKED':
            updateVesselFromEvent(update.data);
            break;
        case 'VESSEL_DEPARTED':
            removeVessel(update.data.vesselId);
            break;
        case 'ASSIGNMENT':
        case 'TUGBOAT_ARRIVED':
        case 'ASSISTANCE_COMPLETE':
            // State updates handled by subsequent position updates
            break;
        case 'PORT_STATUS':
            // Could update port statistics here
            break;
    }
    updateUI();
}

function updateTugboat(data) {
    tugboats.set(data.tugboatId, {
        ...data,
        timestamp: new Date(data.timestamp)
    });
}

function updateVessel(data) {
    vessels.set(data.vesselId, {
        vesselId: data.vesselId,
        vesselName: data.vesselName,
        vesselType: data.vesselType,
        position: data.position,
        status: data.status,
        assignedTugboatId: data.assignedTugboatId,
        timestamp: new Date()
    });
}

function updateVesselFromEvent(event) {
    const vessel = vessels.get(event.vesselId);
    if (vessel) {
        vessel.status = 'DOCKED';
        if (event.position) {
            vessel.position = event.position;
        }
        vessels.set(event.vesselId, vessel);
    }
}

function removeVessel(vesselId) {
    vessels.delete(vesselId);
}

function updateUI() {
    updateStats();
    updateTugboatList();
    updateVesselList();
}

function updateStats() {
    document.getElementById('tugboat-count').textContent = tugboats.size;
    document.getElementById('vessel-count').textContent = vessels.size;
    
    let idleCount = 0;
    let assistingCount = 0;
    
    tugboats.forEach(t => {
        if (t.status === 'IDLE') idleCount++;
        if (t.status === 'ASSISTING') assistingCount++;
    });
    
    document.getElementById('idle-count').textContent = idleCount;
    document.getElementById('assisting-count').textContent = assistingCount;
}

function updateTugboatList() {
    const container = document.getElementById('tugboat-list');
    const sortedTugboats = Array.from(tugboats.values())
        .sort((a, b) => a.tugboatName.localeCompare(b.tugboatName));
    
    if (sortedTugboats.length === 0) {
        container.innerHTML = '<div class="empty-state">No tugboats</div>';
        return;
    }
    
    container.innerHTML = sortedTugboats.map(tugboat => `
        <div class="entity-card tugboat">
            <div class="entity-name">${tugboat.tugboatName}</div>
            <div class="entity-details">
                Position: (${Math.round(tugboat.position.x)}, ${Math.round(tugboat.position.y)})<br>
                Speed: ${tugboat.speed} units/s
                ${tugboat.assignedVesselId ? `<br>→ ${tugboat.assignedVesselId}` : ''}
            </div>
            <span class="entity-status ${tugboat.status}">${tugboat.status}</span>
        </div>
    `).join('');
}

function updateVesselList() {
    const container = document.getElementById('vessel-list');
    const sortedVessels = Array.from(vessels.values())
        .sort((a, b) => a.vesselName.localeCompare(b.vesselName));
    
    if (sortedVessels.length === 0) {
        container.innerHTML = '<div class="empty-state">No vessels</div>';
        return;
    }
    
    container.innerHTML = sortedVessels.map(vessel => `
        <div class="entity-card vessel">
            <div class="entity-name">${vessel.vesselName}</div>
            <div class="entity-details">
                Type: ${vessel.vesselType}<br>
                Position: (${Math.round(vessel.position.x)}, ${Math.round(vessel.position.y)})
                ${vessel.assignedTugboatId ? `<br>← ${vessel.assignedTugboatId}` : ''}
            </div>
            <span class="entity-status ${vessel.status}">${vessel.status}</span>
        </div>
    `).join('');
}

function render() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Save context
    ctx.save();
    
    // Draw grid
    drawGrid();
    
    // Draw connection lines
    drawConnections();
    
    // Draw vessels
    vessels.forEach(vessel => drawVessel(vessel));
    
    // Draw tugboats
    tugboats.forEach(tugboat => drawTugboat(tugboat));
    
    // Restore context
    ctx.restore();
    
    requestAnimationFrame(render);
}

function toCanvasX(x) {
    return offsetX + x * scale;
}

function toCanvasY(y) {
    return offsetY + y * scale;
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= PORT_SIZE; i += GRID_SIZE) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(toCanvasX(i), toCanvasY(0));
        ctx.lineTo(toCanvasX(i), toCanvasY(PORT_SIZE));
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), toCanvasY(i));
        ctx.lineTo(toCanvasX(PORT_SIZE), toCanvasY(i));
        ctx.stroke();
    }
    
    // Border
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(toCanvasX(0), toCanvasY(0), PORT_SIZE * scale, PORT_SIZE * scale);
}

function drawConnections() {
    tugboats.forEach(tugboat => {
        if (tugboat.assignedVesselId) {
            const vessel = vessels.get(tugboat.assignedVesselId);
            if (vessel) {
                ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                
                ctx.beginPath();
                ctx.moveTo(toCanvasX(tugboat.position.x), toCanvasY(tugboat.position.y));
                ctx.lineTo(toCanvasX(vessel.position.x), toCanvasY(vessel.position.y));
                ctx.stroke();
                
                ctx.setLineDash([]);
            }
        }
    });
}

function drawTugboat(tugboat) {
    const x = toCanvasX(tugboat.position.x);
    const y = toCanvasY(tugboat.position.y);
    const radius = Math.max(8, 8 * scale);
    
    // Determine color based on status
    let color = '#00d4ff'; // IDLE/MOVING
    if (tugboat.status === 'ASSISTING') {
        color = '#ffaa00';
    }
    
    // Outer glow for moving
    if (tugboat.status === 'MOVING') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
    }
    
    // Draw circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Border
    ctx.strokeStyle = '#0099cc';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(10, 10 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(tugboat.tugboatName, x, y - radius - 8);
}

function drawVessel(vessel) {
    const x = toCanvasX(vessel.position.x);
    const y = toCanvasY(vessel.position.y);
    const size = Math.max(12, 12 * scale);
    
    // Determine color based on status
    let color = '#e94560';
    if (vessel.status === 'BEING_ASSISTED') {
        color = '#ffaa00';
    }
    
    // Blink effect for requesting
    if (vessel.status === 'REQUESTING_ASSISTANCE') {
        const opacity = (Math.sin(Date.now() / 300) + 1) / 2;
        color = `rgba(233, 69, 96, ${opacity})`;
    }
    
    // Draw diamond shape
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#cc3344';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(10, 10 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(vessel.vesselName, x, y + size + 15);
}
