// engine.js - Core 2.5D Canvas Engine
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false }); 
        
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Game State
        this.lastTime = performance.now();
        this.entities = [];
        this.worldMap = [];
        this.tileSize = 64; 
        
        // Camera (centered on a focus point/entity)
        this.camera = { x: 0, y: 0, zoom: 1 };
        
        // Loop
        this.isRunning = true;
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;
    }

    setMap(mapData) {
        this.worldMap = mapData;
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    setCameraFocus(entity) {
        this.camera.focus = entity;
    }

    updateCamera() {
        if (this.camera.focus) {
            // Smoothly track focus
            const targetX = this.camera.focus.x * this.tileSize;
            const targetY = this.camera.focus.y * this.tileSize;
            
            // LERP for smooth follow camera
            this.camera.x += (targetX - this.camera.x) * 0.1;
            this.camera.y += (targetY - this.camera.y) * 0.1;
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;
        
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(dt) {
        this.updateCamera();
        for (const entity of this.entities) {
            if (entity.update) entity.update(dt);
        }
    }

    draw() {
        // Clear background (Mars atmospheric dust color)
        this.ctx.fillStyle = '#1c1313'; 
        this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        this.ctx.save();
        
        // Move to center of screen
        this.ctx.translate(this.displayWidth / 2, this.displayHeight / 2);
        // Apply camera zoom if any
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        // Translate by camera position
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.drawMap();
        this.drawEntities();

        this.ctx.restore();
    }

    drawMap() {
        if (!this.worldMap.length) return;
        
        const rRows = this.worldMap.length;
        const rCols = this.worldMap[0].length;
        
        for (let y = 0; y < rRows; y++) {
            for (let x = 0; x < rCols; x++) {
                const tileType = this.worldMap[y][x];
                const drawX = x * this.tileSize;
                const drawY = y * this.tileSize;
                
                // Draw Base Terrain (Mars sand)
                this.ctx.fillStyle = '#6e3020';
                this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                
                // Draw tile border (Sci-fi grid feel)
                this.ctx.strokeStyle = 'rgba(255, 107, 53, 0.1)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);

                // Draw Object/Obstacle based on tileType
                if (tileType === 1) {
                    // Rock / Cliff face
                    this.ctx.fillStyle = '#3a1f1b';
                    this.ctx.fillRect(drawX + 4, drawY + 4, this.tileSize - 8, this.tileSize - 8);
                    
                    // 2.5D element: draw a top face to give depth
                    this.ctx.fillStyle = '#553028';
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawX + 4, drawY + 4);
                    this.ctx.lineTo(drawX + this.tileSize - 4, drawY + 4);
                    this.ctx.lineTo(drawX + this.tileSize - 4 - 8, drawY - 8);
                    this.ctx.lineTo(drawX + 4 - 8, drawY - 8);
                    this.ctx.fill();
                } else if (tileType === 2) {
                    // Collectible Scrap
                    const floatOffset = Math.sin(Date.now() / 300) * 3;
                    this.ctx.fillStyle = '#a0aab5';
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(drawX + this.tileSize/2, drawY + this.tileSize/2 + floatOffset, this.tileSize/4, 0, Math.PI*2);
                    this.ctx.fill();
                    
                    // Core glow inside scrap
                    this.ctx.fillStyle = '#38bdf8';
                    this.ctx.beginPath();
                    this.ctx.arc(drawX + this.tileSize/2, drawY + this.tileSize/2 + floatOffset, this.tileSize/8, 0, Math.PI*2);
                    this.ctx.fill();
                    
                    this.ctx.shadowBlur = 0;
                }
            }
        }
    }

    drawEntities() {
        // Sort entities by Y position to get correct 2.5D depth overlapping
        this.entities.sort((a, b) => a.y - b.y);
        
        for (const entity of this.entities) {
            if (entity.draw) {
                const drawX = entity.x * this.tileSize;
                const drawY = entity.y * this.tileSize;
                this.ctx.save();
                this.ctx.translate(drawX, drawY);
                entity.draw(this.ctx, this.tileSize);
                this.ctx.restore();
            }
        }
    }
}
