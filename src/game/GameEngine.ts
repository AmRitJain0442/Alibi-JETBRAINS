// Core Game Engine - Canvas-based renderer with sprite animation

import { MapGenerator, MapData, Building } from './MapGenerator';

export interface Position {
  x: number;
  y: number;
}

export interface SpriteConfig {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  framesPerRow: number;
  totalFrames: number;
  animationSpeed: number; // frames per second
  renderScale: number; // scale factor for rendering
}

export interface AnimatedSprite {
  config: SpriteConfig;
  currentFrame: number;
  direction: 'down' | 'left' | 'right' | 'up';
  isMoving: boolean;
  position: Position;
  lastFrameTime: number;
}

export interface NPC {
  id: string;
  sprite: AnimatedSprite;
  targetPosition: Position | null;
  speed: number;
  waitTime: number;
  lastMoveTime: number;
  roamBounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface Location {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  interactable: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mapImage: HTMLImageElement | null = null;
  private mapCanvas: HTMLCanvasElement | null = null;
  private mapGenerator: MapGenerator | null = null;
  private mapData: MapData | null = null;
  private sprites: Map<string, AnimatedSprite> = new Map();
  private locations: Location[] = [];
  private cameraOffset: Position = { x: 0, y: 0 };
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private keysPressed: Set<string> = new Set();
  private playerSpeed: number = 1.5;
  private onLocationEnter?: (locationId: string) => void;
  private onLocationExit?: (locationId: string) => void;
  private currentLocation: string | null = null;

  // UI Elements
  private uiElements: Map<string, { image: HTMLImageElement; position: Position; visible: boolean }> = new Map();

  // NPCs
  private npcs: NPC[] = [];

  // Rain effect
  private rainDrops: Array<{
    x: number;
    y: number;
    length: number;
    speed: number;
    opacity: number;
  }> = [];
  private rainEnabled: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
    this.setupInputHandlers();
  }

  private setupLocationsFromMap() {
    if (!this.mapData) return;

    // Convert buildings from MapData to Location format
    this.locations = this.mapData.buildings
      .filter(b => b.interactable)
      .map(b => ({
        id: b.id,
        name: b.name,
        bounds: {
          x: b.x * this.mapData!.tileSize,
          y: b.y * this.mapData!.tileSize,
          width: b.width * this.mapData!.tileSize,
          height: b.height * this.mapData!.tileSize
        },
        interactable: true
      }));
  }

  setupStaticMapLocations() {
    // Define interactive locations for the static map (1408x768)
    this.locations = [
      {
        id: 'museum',
        name: 'Meridian Museum',
        bounds: { x: 20, y: 40, width: 180, height: 160 },
        interactable: true
      },
      {
        id: 'gotham_corp',
        name: 'Gotham Corp HQ',
        bounds: { x: 250, y: 20, width: 200, height: 280 },
        interactable: true
      },
      {
        id: 'jewelry_store',
        name: "Diamond's Jewelry",
        bounds: { x: 680, y: 50, width: 140, height: 100 },
        interactable: true
      },
      {
        id: 'diner',
        name: 'Noir Diner',
        bounds: { x: 840, y: 50, width: 120, height: 100 },
        interactable: true
      },
      {
        id: 'city_hall',
        name: 'City Hall',
        bounds: { x: 1050, y: 120, width: 320, height: 250 },
        interactable: true
      }
    ];
  }

  private setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.key.toLowerCase());

      // Prevent scrolling with arrow keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  async loadMap(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.mapImage = img;
        resolve();
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }

  generateProceduralMap(width: number = 50, height: number = 35, tileSize: number = 32): void {
    this.mapGenerator = new MapGenerator(width, height, tileSize);
    this.mapData = this.mapGenerator.generate();

    // Create an offscreen canvas to render the map once
    this.mapCanvas = document.createElement('canvas');
    this.mapGenerator.renderToCanvas(this.mapCanvas);

    // Clear the static map image since we're using procedural now
    this.mapImage = null;

    // Setup locations from generated buildings
    this.setupLocationsFromMap();
  }

  getMapDimensions(): { width: number; height: number } {
    if (this.mapData) {
      return {
        width: this.mapData.width * this.mapData.tileSize,
        height: this.mapData.height * this.mapData.tileSize
      };
    }
    if (this.mapImage) {
      return {
        width: this.mapImage.width,
        height: this.mapImage.height
      };
    }
    return { width: 1600, height: 1120 }; // Default
  }

  isPositionWalkable(x: number, y: number): boolean {
    if (this.mapGenerator && this.mapData) {
      return this.mapGenerator.isWalkable(x, y);
    }
    return true; // If no map generator, allow all movement
  }

  getBuildingAt(x: number, y: number): Building | null {
    if (this.mapGenerator) {
      return this.mapGenerator.getBuildingAt(x, y);
    }
    return null;
  }

  // Remove background from image (makes white/light pixels transparent)
  private removeBackground(img: HTMLImageElement, tolerance: number = 30): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sample corner pixels to detect background color
    const bgColor = { r: data[0], g: data[1], b: data[2] };

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel is close to background color
      const diffR = Math.abs(r - bgColor.r);
      const diffG = Math.abs(g - bgColor.g);
      const diffB = Math.abs(b - bgColor.b);

      if (diffR < tolerance && diffG < tolerance && diffB < tolerance) {
        // Make pixel transparent
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  async loadSpriteSheet(
    id: string,
    imagePath: string,
    frameWidth: number,
    frameHeight: number,
    framesPerRow: number,
    totalFrames: number,
    animationSpeed: number = 8,
    renderScale: number = 0.25 // Default scale down to 25% (256 -> 64px)
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Allow canvas manipulation
      img.onload = () => {
        // Remove background from sprite
        const processedCanvas = this.removeBackground(img);

        // Create a new image from the processed canvas
        const processedImg = new Image();
        processedImg.onload = () => {
          const sprite: AnimatedSprite = {
            config: {
              image: processedImg,
              frameWidth,
              frameHeight,
              framesPerRow,
              totalFrames,
              animationSpeed,
              renderScale
            },
            currentFrame: 0,
            direction: 'down',
            isMoving: false,
            position: { x: 600, y: 400 }, // Start position centered on map
            lastFrameTime: 0
          };
          this.sprites.set(id, sprite);
          resolve();
        };
        processedImg.src = processedCanvas.toDataURL();
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }

  async loadUIElement(id: string, imagePath: string, x: number, y: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.uiElements.set(id, {
          image: img,
          position: { x, y },
          visible: false
        });
        resolve();
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }

  setUIElementVisible(id: string, visible: boolean) {
    const element = this.uiElements.get(id);
    if (element) {
      element.visible = visible;
    }
  }

  setSpritePosition(id: string, x: number, y: number) {
    const sprite = this.sprites.get(id);
    if (sprite) {
      sprite.position.x = x;
      sprite.position.y = y;
    }
  }

  getSpritePosition(id: string): Position | null {
    const sprite = this.sprites.get(id);
    return sprite ? { ...sprite.position } : null;
  }

  async addNPC(
    id: string,
    imagePath: string,
    startX: number,
    startY: number,
    roamBounds: { minX: number; minY: number; maxX: number; maxY: number },
    speed: number = 1.5
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Remove background from NPC sprite
        const processedCanvas = this.removeBackground(img);
        const processedImg = new Image();

        processedImg.onload = () => {
          const sprite: AnimatedSprite = {
            config: {
              image: processedImg,
              frameWidth: 256,
              frameHeight: 256,
              framesPerRow: 4,
              totalFrames: 16,
              animationSpeed: 6,
              renderScale: 0.2 // Slightly smaller than player
            },
            currentFrame: 0,
            direction: 'down',
            isMoving: false,
            position: { x: startX, y: startY },
            lastFrameTime: 0
          };

          const npc: NPC = {
            id,
            sprite,
            targetPosition: null,
            speed,
            waitTime: Math.random() * 3000 + 1000, // Random wait 1-4 seconds
            lastMoveTime: Date.now(),
            roamBounds
          };

          this.npcs.push(npc);
          resolve();
        };
        processedImg.src = processedCanvas.toDataURL();
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  }

  private updateNPCs(currentTime: number) {
    for (const npc of this.npcs) {
      // If NPC has no target, maybe pick a new one
      if (!npc.targetPosition) {
        if (currentTime - npc.lastMoveTime > npc.waitTime) {
          // Pick a random target within roam bounds
          npc.targetPosition = {
            x: npc.roamBounds.minX + Math.random() * (npc.roamBounds.maxX - npc.roamBounds.minX),
            y: npc.roamBounds.minY + Math.random() * (npc.roamBounds.maxY - npc.roamBounds.minY)
          };
          npc.sprite.isMoving = true;
        }
      } else {
        // Move towards target
        const dx = npc.targetPosition.x - npc.sprite.position.x;
        const dy = npc.targetPosition.y - npc.sprite.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          // Reached target
          npc.targetPosition = null;
          npc.sprite.isMoving = false;
          npc.lastMoveTime = currentTime;
          npc.waitTime = Math.random() * 3000 + 1000;
        } else {
          // Move towards target
          const moveX = (dx / distance) * npc.speed;
          const moveY = (dy / distance) * npc.speed;

          npc.sprite.position.x += moveX;
          npc.sprite.position.y += moveY;

          // Update direction based on movement
          if (Math.abs(dx) > Math.abs(dy)) {
            npc.sprite.direction = dx > 0 ? 'right' : 'left';
          } else {
            npc.sprite.direction = dy > 0 ? 'down' : 'up';
          }
        }
      }

      // Update animation
      this.updateSpriteAnimation(npc.sprite, currentTime);
    }
  }

  onEnterLocation(callback: (locationId: string) => void) {
    this.onLocationEnter = callback;
  }

  onExitLocation(callback: (locationId: string) => void) {
    this.onLocationExit = callback;
  }

  private updatePlayerMovement(_deltaTime: number) {
    const player = this.sprites.get('player');
    if (!player) return;

    let dx = 0;
    let dy = 0;
    let newDirection = player.direction;

    // WASD and Arrow keys
    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) {
      dy = -this.playerSpeed;
      newDirection = 'up';
    }
    if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
      dy = this.playerSpeed;
      newDirection = 'down';
    }
    if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) {
      dx = -this.playerSpeed;
      newDirection = 'left';
    }
    if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
      dx = this.playerSpeed;
      newDirection = 'right';
    }

    player.isMoving = dx !== 0 || dy !== 0;
    player.direction = newDirection;

    if (player.isMoving) {
      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      const newX = player.position.x + dx;
      const newY = player.position.y + dy;

      // Get map dimensions
      const mapDims = this.getMapDimensions();
      const spriteWidth = player.config.frameWidth * player.config.renderScale;
      const spriteHeight = player.config.frameHeight * player.config.renderScale;

      // Check tile-based collision if using procedural map
      const canMove = this.checkMovementCollision(newX, newY, spriteWidth, spriteHeight);

      if (canMove) {
        // Boundary checking (keep player on map)
        player.position.x = Math.max(0, Math.min(mapDims.width - spriteWidth, newX));
        player.position.y = Math.max(0, Math.min(mapDims.height - spriteHeight, newY));
      }

      // Check location collisions
      this.checkLocationCollisions(player.position);
    }

    // Update camera to follow player
    this.updateCamera(player.position);
  }

  private checkMovementCollision(x: number, y: number, width: number, height: number): boolean {
    if (!this.mapGenerator || !this.mapData) {
      return true; // Allow movement if no procedural map
    }

    // Check corners and center of the sprite
    const checkPoints = [
      { x: x + width * 0.2, y: y + height * 0.8 },         // Bottom left
      { x: x + width * 0.8, y: y + height * 0.8 },         // Bottom right
      { x: x + width * 0.5, y: y + height * 0.9 },         // Bottom center
    ];

    for (const point of checkPoints) {
      if (!this.isPositionWalkable(point.x, point.y)) {
        return false;
      }
    }

    return true;
  }

  private checkLocationCollisions(position: Position) {
    let inLocation: string | null = null;

    // Get sprite center for collision
    const player = this.sprites.get('player');
    const spriteWidth = player ? player.config.frameWidth * player.config.renderScale : 64;
    const spriteHeight = player ? player.config.frameHeight * player.config.renderScale : 64;
    const centerX = position.x + spriteWidth / 2;
    const centerY = position.y + spriteHeight / 2;

    for (const location of this.locations) {
      if (
        centerX >= location.bounds.x &&
        centerX <= location.bounds.x + location.bounds.width &&
        centerY >= location.bounds.y &&
        centerY <= location.bounds.y + location.bounds.height
      ) {
        inLocation = location.id;
        break;
      }
    }

    if (inLocation !== this.currentLocation) {
      if (this.currentLocation && this.onLocationExit) {
        this.onLocationExit(this.currentLocation);
      }
      if (inLocation && this.onLocationEnter) {
        this.onLocationEnter(inLocation);
      }
      this.currentLocation = inLocation;
    }
  }

  private updateCamera(playerPos: Position) {
    const targetX = playerPos.x - this.canvas.width / 2;
    const targetY = playerPos.y - this.canvas.height / 2;

    // Smooth camera follow
    this.cameraOffset.x += (targetX - this.cameraOffset.x) * 0.1;
    this.cameraOffset.y += (targetY - this.cameraOffset.y) * 0.1;

    // Clamp camera to map bounds
    const mapDims = this.getMapDimensions();
    this.cameraOffset.x = Math.max(0, Math.min(mapDims.width - this.canvas.width, this.cameraOffset.x));
    this.cameraOffset.y = Math.max(0, Math.min(mapDims.height - this.canvas.height, this.cameraOffset.y));
  }

  private updateSpriteAnimation(sprite: AnimatedSprite, currentTime: number) {
    if (!sprite.isMoving) {
      sprite.currentFrame = 0;
      return;
    }

    const frameDuration = 1000 / sprite.config.animationSpeed;
    if (currentTime - sprite.lastFrameTime >= frameDuration) {
      sprite.currentFrame = (sprite.currentFrame + 1) % 4; // 4 frames per direction
      sprite.lastFrameTime = currentTime;
    }
  }

  private getDirectionRow(direction: 'down' | 'left' | 'right' | 'up'): number {
    // Sprite sheet layout: Row 0 = down, Row 1 = left, Row 2 = right, Row 3 = up
    switch (direction) {
      case 'down': return 0;
      case 'left': return 1;
      case 'right': return 2;
      case 'up': return 3;
    }
  }

  private render(currentTime: number) {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0c';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context for camera transform
    this.ctx.save();
    this.ctx.translate(-this.cameraOffset.x, -this.cameraOffset.y);

    // Draw map (procedural or static)
    if (this.mapCanvas) {
      this.ctx.drawImage(this.mapCanvas, 0, 0);
    } else if (this.mapImage) {
      this.ctx.drawImage(this.mapImage, 0, 0);
    }

    // Collect all sprites (player + NPCs) for depth sorting
    const allSprites: AnimatedSprite[] = [
      ...Array.from(this.sprites.values()),
      ...this.npcs.map(npc => npc.sprite)
    ];

    // Sort by Y position for proper depth ordering
    allSprites.sort((a, b) => a.position.y - b.position.y);

    for (const sprite of allSprites) {
      this.updateSpriteAnimation(sprite, currentTime);
      this.drawSprite(sprite);
    }

    // Debug: Draw location bounds (optional)
    // this.drawLocationBounds();

    // Restore context
    this.ctx.restore();

    // Draw rain effect (screen space, not affected by camera)
    this.drawRain();

    // Draw UI elements (fixed position, not affected by camera)
    this.drawUI();
  }

  private drawSprite(sprite: AnimatedSprite) {
    const { config, currentFrame, direction, position } = sprite;
    const row = this.getDirectionRow(direction);

    const sourceX = currentFrame * config.frameWidth;
    const sourceY = row * config.frameHeight;

    // Calculate rendered size with scale
    const renderWidth = config.frameWidth * config.renderScale;
    const renderHeight = config.frameHeight * config.renderScale;

    this.ctx.drawImage(
      config.image,
      sourceX, sourceY,
      config.frameWidth, config.frameHeight,
      position.x, position.y,
      renderWidth, renderHeight
    );
  }

  // Debug method - call this.drawLocationBounds() in render() to see location bounds
  /* istanbul ignore next */
  public drawLocationBounds() {
    this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    this.ctx.lineWidth = 2;

    for (const location of this.locations) {
      this.ctx.strokeRect(
        location.bounds.x,
        location.bounds.y,
        location.bounds.width,
        location.bounds.height
      );

      this.ctx.fillStyle = 'yellow';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(location.name, location.bounds.x, location.bounds.y - 5);
    }
  }

  private drawUI() {
    for (const [_id, element] of this.uiElements) {
      if (element.visible) {
        this.ctx.drawImage(element.image, element.position.x, element.position.y);
      }
    }
  }

  // Rain effect methods
  private initRain() {
    this.rainDrops = [];
    const dropCount = 200;

    for (let i = 0; i < dropCount; i++) {
      this.rainDrops.push({
        x: Math.random() * 2000,
        y: Math.random() * 1500,
        length: 10 + Math.random() * 20,
        speed: 8 + Math.random() * 8,
        opacity: 0.1 + Math.random() * 0.3
      });
    }
  }

  private updateRain() {
    for (const drop of this.rainDrops) {
      drop.y += drop.speed;
      drop.x += drop.speed * 0.2; // Slight wind effect

      // Reset drop when it goes off screen
      if (drop.y > 1500) {
        drop.y = -drop.length;
        drop.x = Math.random() * 2000;
      }
      if (drop.x > 2000) {
        drop.x = -10;
      }
    }
  }

  private drawRain() {
    if (!this.rainEnabled) return;

    this.ctx.save();

    for (const drop of this.rainDrops) {
      this.ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x + drop.length * 0.2, drop.y + drop.length);
      this.ctx.stroke();
    }

    // Add rain mist/fog overlay
    this.ctx.fillStyle = 'rgba(100, 120, 150, 0.08)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.restore();
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.updatePlayerMovement(deltaTime);
    this.updateNPCs(currentTime);
    this.updateRain();
    this.render(currentTime);

    requestAnimationFrame(this.gameLoop);
  };

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.handleResize();
    this.initRain();
    requestAnimationFrame(this.gameLoop);
  }

  stop() {
    this.isRunning = false;
  }

  // Get current location name for UI
  getCurrentLocationName(): string | null {
    if (!this.currentLocation) return null;
    const location = this.locations.find(l => l.id === this.currentLocation);
    return location?.name || null;
  }
}
