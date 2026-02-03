// Procedural Map Generator - Creates a noir city with roads, buildings, and decorations

export type TileType =
  | 'road_h' | 'road_v' | 'road_cross' | 'road_corner_tl' | 'road_corner_tr' | 'road_corner_bl' | 'road_corner_br'
  | 'road_t_up' | 'road_t_down' | 'road_t_left' | 'road_t_right'
  | 'sidewalk' | 'grass' | 'water'
  | 'building' | 'building_door'
  | 'empty';

export interface Tile {
  type: TileType;
  color: string;
  walkable: boolean;
  buildingId?: string;
}

export interface Building {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor: string;
  doorX: number;
  doorY: number;
  interactable: boolean;
}

export interface MapData {
  width: number;
  height: number;
  tileSize: number;
  tiles: Tile[][];
  buildings: Building[];
}

// Color palette - noir style
const COLORS = {
  road: '#2a2a2a',
  roadLine: '#4a4a3a',
  sidewalk: '#4a4a4a',
  grass: '#1a2a1a',
  grassLight: '#2a3a2a',
  water: '#1a2a3a',

  // Building colors
  buildingDark: '#1a1a1f',
  buildingMid: '#252530',
  buildingLight: '#353540',
  buildingBrick: '#3a2a2a',
  buildingConcrete: '#3a3a3a',

  // Roof colors
  roofDark: '#0a0a0f',
  roofRed: '#4a2020',
  roofGreen: '#203a20',

  // Accents
  windowLit: '#d4a853',
  windowDark: '#1a1a2a',
  door: '#2a1a1a',
  doorFrame: '#d4a853',

  // Street elements
  lampPost: '#3a3a3a',
  lampLight: '#d4a853',
};

export class MapGenerator {
  private width: number;
  private height: number;
  private tileSize: number;
  private tiles: Tile[][];
  private buildings: Building[];

  constructor(width: number = 50, height: number = 35, tileSize: number = 32) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tiles = [];
    this.buildings = [];
  }

  generate(): MapData {
    // Initialize with grass
    this.initializeTiles();

    // Generate road grid
    this.generateRoads();

    // Add sidewalks along roads
    this.generateSidewalks();

    // Place buildings
    this.placeBuildings();

    // Add some parks/grass areas
    this.addParks();

    return {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      tiles: this.tiles,
      buildings: this.buildings
    };
  }

  private initializeTiles() {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = {
          type: 'grass',
          color: (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassLight,
          walkable: true
        };
      }
    }
  }

  private generateRoads() {
    // Main horizontal roads
    const hRoads = [5, 15, 25];
    // Main vertical roads
    const vRoads = [5, 15, 25, 35, 45];

    // Draw horizontal roads (2 tiles wide)
    for (const roadY of hRoads) {
      for (let x = 0; x < this.width; x++) {
        for (let dy = 0; dy < 2; dy++) {
          if (roadY + dy < this.height) {
            this.tiles[roadY + dy][x] = {
              type: 'road_h',
              color: COLORS.road,
              walkable: true
            };
          }
        }
      }
    }

    // Draw vertical roads (2 tiles wide)
    for (const roadX of vRoads) {
      for (let y = 0; y < this.height; y++) {
        for (let dx = 0; dx < 2; dx++) {
          if (roadX + dx < this.width) {
            const existing = this.tiles[y][roadX + dx];
            if (existing.type.startsWith('road_h')) {
              this.tiles[y][roadX + dx] = {
                type: 'road_cross',
                color: COLORS.road,
                walkable: true
              };
            } else {
              this.tiles[y][roadX + dx] = {
                type: 'road_v',
                color: COLORS.road,
                walkable: true
              };
            }
          }
        }
      }
    }
  }

  private generateSidewalks() {
    // Add sidewalks adjacent to roads
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].type.startsWith('road')) {
          // Check adjacent tiles
          const adjacent = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 }
          ];

          for (const { dx, dy } of adjacent) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
              if (this.tiles[ny][nx].type === 'grass') {
                this.tiles[ny][nx] = {
                  type: 'sidewalk',
                  color: COLORS.sidewalk,
                  walkable: true
                };
              }
            }
          }
        }
      }
    }
  }

  private placeBuildings() {
    // Define key buildings for the game
    const keyBuildings: Omit<Building, 'doorX' | 'doorY'>[] = [
      {
        id: 'museum',
        name: 'Meridian Museum',
        x: 8, y: 8,
        width: 6, height: 5,
        color: COLORS.buildingConcrete,
        roofColor: COLORS.roofDark,
        interactable: true
      },
      {
        id: 'gotham_corp',
        name: 'Gotham Corp HQ',
        x: 18, y: 1,
        width: 6, height: 12,
        color: COLORS.buildingDark,
        roofColor: COLORS.roofDark,
        interactable: true
      },
      {
        id: 'jewelry_store',
        name: "Diamond's Jewelry",
        x: 28, y: 8,
        width: 5, height: 4,
        color: COLORS.buildingLight,
        roofColor: COLORS.roofGreen,
        interactable: true
      },
      {
        id: 'diner',
        name: 'Noir Diner',
        x: 38, y: 8,
        width: 5, height: 4,
        color: COLORS.buildingBrick,
        roofColor: COLORS.roofRed,
        interactable: true
      },
      {
        id: 'city_hall',
        name: 'City Hall',
        x: 38, y: 18,
        width: 8, height: 6,
        color: COLORS.buildingConcrete,
        roofColor: COLORS.roofDark,
        interactable: true
      }
    ];

    // Place key buildings
    for (const building of keyBuildings) {
      const fullBuilding: Building = {
        ...building,
        doorX: building.x + Math.floor(building.width / 2),
        doorY: building.y + building.height - 1
      };
      this.buildings.push(fullBuilding);
      this.fillBuildingTiles(fullBuilding);
    }

    // Add some random smaller buildings
    this.addRandomBuildings();
  }

  private addRandomBuildings() {
    const smallBuildingColors = [
      COLORS.buildingDark,
      COLORS.buildingMid,
      COLORS.buildingLight,
      COLORS.buildingBrick
    ];

    const roofColors = [COLORS.roofDark, COLORS.roofRed, COLORS.roofGreen];

    // Try to place random buildings in empty areas
    const attempts = 30;
    for (let i = 0; i < attempts; i++) {
      const width = 3 + Math.floor(Math.random() * 3);
      const height = 3 + Math.floor(Math.random() * 3);
      const x = 1 + Math.floor(Math.random() * (this.width - width - 2));
      const y = 1 + Math.floor(Math.random() * (this.height - height - 2));

      if (this.canPlaceBuilding(x, y, width, height)) {
        const building: Building = {
          id: `building_${i}`,
          name: `Building ${i}`,
          x, y, width, height,
          color: smallBuildingColors[Math.floor(Math.random() * smallBuildingColors.length)],
          roofColor: roofColors[Math.floor(Math.random() * roofColors.length)],
          doorX: x + Math.floor(width / 2),
          doorY: y + height - 1,
          interactable: false
        };
        this.buildings.push(building);
        this.fillBuildingTiles(building);
      }
    }
  }

  private canPlaceBuilding(x: number, y: number, width: number, height: number): boolean {
    // Check if area is clear (only grass/sidewalk, no roads or other buildings)
    // Also ensure there's a sidewalk or road nearby for access

    let hasAccess = false;

    for (let dy = -1; dy <= height; dy++) {
      for (let dx = -1; dx <= width; dx++) {
        const tx = x + dx;
        const ty = y + dy;

        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
          continue;
        }

        const tile = this.tiles[ty][tx];

        // Check perimeter for access
        if (dx === -1 || dx === width || dy === -1 || dy === height) {
          if (tile.type === 'sidewalk' || tile.type.startsWith('road')) {
            hasAccess = true;
          }
          continue;
        }

        // Inside the building area - must be grass
        if (tile.type !== 'grass') {
          return false;
        }

        // Check for other buildings
        if (tile.buildingId) {
          return false;
        }
      }
    }

    return hasAccess;
  }

  private fillBuildingTiles(building: Building) {
    for (let dy = 0; dy < building.height; dy++) {
      for (let dx = 0; dx < building.width; dx++) {
        const tx = building.x + dx;
        const ty = building.y + dy;

        if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
          const isDoor = tx === building.doorX && ty === building.doorY;
          this.tiles[ty][tx] = {
            type: isDoor ? 'building_door' : 'building',
            color: building.color,
            walkable: false,
            buildingId: building.id
          };
        }
      }
    }
  }

  private addParks() {
    // Add a small park area
    const parkX = 8;
    const parkY = 18;
    const parkWidth = 5;
    const parkHeight = 5;

    for (let dy = 0; dy < parkHeight; dy++) {
      for (let dx = 0; dx < parkWidth; dx++) {
        const tx = parkX + dx;
        const ty = parkY + dy;

        if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
          if (this.tiles[ty][tx].type === 'grass' || this.tiles[ty][tx].type === 'sidewalk') {
            this.tiles[ty][tx] = {
              type: 'grass',
              color: (dx + dy) % 2 === 0 ? '#1a3a1a' : '#2a4a2a',
              walkable: true
            };
          }
        }
      }
    }
  }

  // Render the map to a canvas
  renderToCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!;
    canvas.width = this.width * this.tileSize;
    canvas.height = this.height * this.tileSize;

    // Draw base tiles
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        this.drawTile(ctx, x, y, tile);
      }
    }

    // Draw buildings with 3D effect
    for (const building of this.buildings) {
      this.drawBuilding(ctx, building);
    }

    // Draw road markings
    this.drawRoadMarkings(ctx);

    // Draw street lamps
    this.drawStreetLamps(ctx);

    // Draw decorations
    this.drawDecorations(ctx);
  }

  private drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, tile: Tile) {
    const px = x * this.tileSize;
    const py = y * this.tileSize;

    ctx.fillStyle = tile.color;
    ctx.fillRect(px, py, this.tileSize, this.tileSize);

    // Add texture/detail based on tile type
    if (tile.type === 'grass') {
      // Random grass blades
      ctx.fillStyle = 'rgba(0, 50, 0, 0.3)';
      for (let i = 0; i < 3; i++) {
        const gx = px + Math.random() * this.tileSize;
        const gy = py + Math.random() * this.tileSize;
        ctx.fillRect(gx, gy, 1, 3);
      }
    } else if (tile.type === 'sidewalk') {
      // Sidewalk cracks
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + this.tileSize / 2, py);
      ctx.lineTo(px + this.tileSize / 2, py + this.tileSize);
      ctx.stroke();
    }
  }

  private drawBuilding(ctx: CanvasRenderingContext2D, building: Building) {
    const px = building.x * this.tileSize;
    const py = building.y * this.tileSize;
    const w = building.width * this.tileSize;
    const h = building.height * this.tileSize;

    // Building shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px + 4, py + 4, w, h);

    // Main building body
    ctx.fillStyle = building.color;
    ctx.fillRect(px, py, w, h);

    // Building border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, w, h);

    // Roof
    ctx.fillStyle = building.roofColor;
    ctx.fillRect(px, py, w, this.tileSize * 0.5);

    // Windows
    const windowRows = Math.floor(building.height - 1);
    const windowCols = Math.floor(building.width);
    const windowSize = this.tileSize * 0.4;

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const wx = px + col * this.tileSize + (this.tileSize - windowSize) / 2;
        const wy = py + (row + 0.5) * this.tileSize + (this.tileSize - windowSize) / 2;

        // Random lit windows
        const isLit = Math.random() > 0.4;
        ctx.fillStyle = isLit ? COLORS.windowLit : COLORS.windowDark;
        ctx.fillRect(wx, wy, windowSize, windowSize);

        // Window frame
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, windowSize, windowSize);

        // Window cross
        if (isLit) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.moveTo(wx + windowSize / 2, wy);
          ctx.lineTo(wx + windowSize / 2, wy + windowSize);
          ctx.moveTo(wx, wy + windowSize / 2);
          ctx.lineTo(wx + windowSize, wy + windowSize / 2);
          ctx.stroke();
        }
      }
    }

    // Door
    const doorX = building.doorX * this.tileSize + this.tileSize * 0.2;
    const doorY = (building.y + building.height - 1) * this.tileSize + this.tileSize * 0.1;
    const doorW = this.tileSize * 0.6;
    const doorH = this.tileSize * 0.8;

    ctx.fillStyle = COLORS.door;
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.strokeStyle = COLORS.doorFrame;
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX, doorY, doorW, doorH);

    // Door handle
    ctx.fillStyle = COLORS.doorFrame;
    ctx.beginPath();
    ctx.arc(doorX + doorW * 0.8, doorY + doorH * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Building name sign for interactable buildings
    if (building.interactable) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const signWidth = Math.min(building.name.length * 6 + 10, w - 10);
      const signX = px + (w - signWidth) / 2;
      ctx.fillRect(signX, py + this.tileSize * 0.6, signWidth, 14);

      ctx.fillStyle = COLORS.doorFrame;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(building.name, px + w / 2, py + this.tileSize * 0.6 + 10, signWidth - 4);
    }
  }

  private drawRoadMarkings(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = COLORS.roadLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        const px = x * this.tileSize + this.tileSize / 2;
        const py = y * this.tileSize + this.tileSize / 2;

        if (tile.type === 'road_h') {
          ctx.beginPath();
          ctx.moveTo(px - this.tileSize / 2, py);
          ctx.lineTo(px + this.tileSize / 2, py);
          ctx.stroke();
        } else if (tile.type === 'road_v') {
          ctx.beginPath();
          ctx.moveTo(px, py - this.tileSize / 2);
          ctx.lineTo(px, py + this.tileSize / 2);
          ctx.stroke();
        }
      }
    }

    ctx.setLineDash([]);
  }

  private drawStreetLamps(ctx: CanvasRenderingContext2D) {
    // Place lamps at intersections and along roads
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];

        // Place lamp posts on sidewalks next to intersections
        if (tile.type === 'sidewalk' && x % 8 === 0 && y % 8 === 0) {
          const px = x * this.tileSize + this.tileSize / 2;
          const py = y * this.tileSize + this.tileSize / 2;

          // Lamp post
          ctx.fillStyle = COLORS.lampPost;
          ctx.fillRect(px - 2, py - 20, 4, 25);

          // Lamp head
          ctx.fillStyle = COLORS.lampLight;
          ctx.beginPath();
          ctx.arc(px, py - 22, 6, 0, Math.PI * 2);
          ctx.fill();

          // Light glow
          const gradient = ctx.createRadialGradient(px, py - 22, 0, px, py - 22, 40);
          gradient.addColorStop(0, 'rgba(212, 168, 83, 0.3)');
          gradient.addColorStop(1, 'rgba(212, 168, 83, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(px, py - 22, 40, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private drawDecorations(ctx: CanvasRenderingContext2D) {
    // Add some trees in grass areas
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];

        if (tile.type === 'grass' && !tile.buildingId && Math.random() < 0.02) {
          const px = x * this.tileSize + this.tileSize / 2;
          const py = y * this.tileSize + this.tileSize / 2;

          // Tree trunk
          ctx.fillStyle = '#3a2a1a';
          ctx.fillRect(px - 3, py - 5, 6, 15);

          // Tree foliage
          ctx.fillStyle = '#1a3a1a';
          ctx.beginPath();
          ctx.arc(px, py - 12, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#2a4a2a';
          ctx.beginPath();
          ctx.arc(px - 4, py - 8, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + 4, py - 10, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Add some puddles on roads (noir aesthetic)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];

        if (tile.type.startsWith('road') && Math.random() < 0.01) {
          const px = x * this.tileSize + Math.random() * this.tileSize;
          const py = y * this.tileSize + Math.random() * this.tileSize;

          ctx.fillStyle = 'rgba(30, 40, 50, 0.5)';
          ctx.beginPath();
          ctx.ellipse(px, py, 8 + Math.random() * 10, 4 + Math.random() * 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Get walkable status for collision detection
  isWalkable(x: number, y: number): boolean {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);

    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return false;
    }

    return this.tiles[tileY][tileX].walkable;
  }

  // Get building at position
  getBuildingAt(x: number, y: number): Building | null {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);

    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return null;
    }

    const tile = this.tiles[tileY][tileX];
    if (tile.buildingId) {
      return this.buildings.find(b => b.id === tile.buildingId) || null;
    }

    return null;
  }
}
