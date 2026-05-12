export interface Controls {
  left: boolean;
  right: boolean;
}

export class Car {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  lane: number;
  color: string;
  name: string;
  isObstacle: boolean;

  constructor(x: number, y: number, color: string, name: string, lane: number, isObstacle: boolean = false) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.width = 40;
    this.height = 70;
    this.lane = lane;
    this.color = color;
    this.name = name;
    this.isObstacle = isObstacle;
  }

  update(controls?: Controls, laneWidths?: number[]) {
    if (!this.isObstacle && controls && laneWidths) {
      if (controls.left && this.lane > 0) {
        this.lane--;
        controls.left = false; // Trigger once per press logic should be in component
      }
      if (controls.right && this.lane < 2) {
        this.lane++;
        controls.right = false;
      }
      this.targetX = laneWidths[this.lane];
    }

    // Smooth movement towards lane center
    this.x += (this.targetX - this.x) * 0.2;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Car body (Manual rounded rect for better compatibility)
    const r = 10;
    const w = this.width;
    const h = this.height;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    ctx.lineTo(w / 2, h / 2 - r);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    ctx.lineTo(-w / 2, -h / 2 + r);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    ctx.fill();

    // Windshield
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 10, this.width - 10, 15);

    // Headlights
    ctx.fillStyle = "#ffff00";
    ctx.fillRect(-this.width / 2 + 5, -this.height / 2, 8, 5);
    ctx.fillRect(this.width / 2 - 13, -this.height / 2, 8, 5);

    // Tail lights
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(-this.width / 2 + 5, this.height / 2 - 5, 8, 5);
    ctx.fillRect(this.width / 2 - 13, this.height / 2 - 5, 8, 5);

    ctx.restore();
  }
}
