
import { Direction, VehicleType, VEHICLE_CONFIGS, TurnAction } from './types';

export class Vehicle {
  id: string;
  type: VehicleType;
  direction: Direction;
  turnAction: TurnAction = 'Straight';
  laneIndex: number; // 0 or 1
  x: number;
  y: number;
  speed: number;
  width: number;
  length: number;
  maxSpeed: number;
  acceleration: number;
  color: string;
  isWaiting: boolean = false;
  waitTime: number = 0;
  distanceTraveled: number = 0;
  hasPassedIntersection: boolean = false;
  
  // New properties for realism
  reactionTime: number;
  isBraking: boolean = false;
  targetLaneIndex: number;
  laneChangeProgress: number = 0; // 0 to 1
  lateralOffset: number = 0;
  angle: number = 0;
  isTurning: boolean = false;
  turnProgress: number = 0;
  private turnCenter: { x: number, y: number } = { x: 0, y: 0 };
  private turnRadius: number = 0;
  private startAngle: number = 0;
  private lastSpeed: number = 0;

  constructor(id: string, type: VehicleType, direction: Direction, laneIndex: number, startX: number, startY: number) {
    const config = VEHICLE_CONFIGS[type];
    this.id = id;
    this.type = type;
    this.direction = direction;
    this.laneIndex = laneIndex;
    this.targetLaneIndex = laneIndex;
    this.x = startX;
    this.y = startY;
    this.speed = config.maxSpeed * (0.8 + Math.random() * 0.4); // Slight variation in speed
    this.maxSpeed = this.speed;
    this.acceleration = config.acceleration;
    this.width = config.width;
    this.length = config.length;

    // Initial angle based on direction
    switch (this.direction) {
      case 'North': this.angle = 0; break;
      case 'South': this.angle = Math.PI; break;
      case 'East': this.angle = Math.PI / 2; break;
      case 'West': this.angle = -Math.PI / 2; break;
    }
    
    // Assign random colors for variety
    if (type === 'Car') {
      const carColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280', '#000000', '#ffffff'];
      this.color = carColors[Math.floor(Math.random() * carColors.length)];
    } else if (type === 'Bike') {
      const bikeColors = ['#000000', '#333333', '#555555', '#777777'];
      this.color = bikeColors[Math.floor(Math.random() * bikeColors.length)];
    } else {
      this.color = config.color;
    }

    this.reactionTime = 0.1 + Math.random() * 0.3; // 0.1s to 0.4s reaction time
    this.lastSpeed = this.speed;
  }

  startTurn(centerX: number, centerY: number) {
    this.isTurning = true;
    this.turnProgress = 0;
    
    const offset = 30 + this.laneIndex * 40;
    
    // Calculate turn center and radius for realistic arc
    if (this.turnAction === 'Left') {
      this.turnRadius = 110 - offset; // Tight turn for LHT
      switch (this.direction) {
        case 'North': 
          this.turnCenter = { x: centerX - 110, y: centerY + 110 }; 
          this.startAngle = 0; 
          break;
        case 'South': 
          this.turnCenter = { x: centerX + 110, y: centerY - 110 }; 
          this.startAngle = Math.PI; 
          break;
        case 'East': 
          this.turnCenter = { x: centerX - 110, y: centerY - 110 }; 
          this.startAngle = -Math.PI / 2; 
          break;
        case 'West': 
          this.turnCenter = { x: centerX + 110, y: centerY + 110 }; 
          this.startAngle = Math.PI / 2; 
          break;
      }
    } else if (this.turnAction === 'Right') {
      this.turnRadius = 110 + offset; // Wide turn for LHT
      switch (this.direction) {
        case 'North': 
          this.turnCenter = { x: centerX + 110, y: centerY + 110 }; 
          this.startAngle = Math.PI; 
          break;
        case 'South': 
          this.turnCenter = { x: centerX - 110, y: centerY - 110 }; 
          this.startAngle = 0; 
          break;
        case 'East': 
          this.turnCenter = { x: centerX + 110, y: centerY - 110 }; 
          this.startAngle = -Math.PI / 2; 
          break;
        case 'West': 
          this.turnCenter = { x: centerX - 110, y: centerY + 110 }; 
          this.startAngle = Math.PI / 2; 
          break;
      }
    }
  }

  private completeTurn(centerX: number, centerY: number) {
    this.isTurning = false;
    this.hasPassedIntersection = true;
    const offset = 30 + this.laneIndex * 40;

    if (this.turnAction === 'Left') {
      switch (this.direction) {
        case 'North': 
          this.direction = 'West'; 
          this.y = centerY + offset; 
          this.x = centerX - 110; 
          this.angle = -Math.PI / 2;
          break;
        case 'South': 
          this.direction = 'East'; 
          this.y = centerY - offset; 
          this.x = centerX + 110; 
          this.angle = Math.PI / 2;
          break;
        case 'East': 
          this.direction = 'North'; 
          this.x = centerX - offset; 
          this.y = centerY - 110; 
          this.angle = 0;
          break;
        case 'West': 
          this.direction = 'South'; 
          this.x = centerX + offset; 
          this.y = centerY + 110; 
          this.angle = Math.PI;
          break;
      }
    } else if (this.turnAction === 'Right') {
      switch (this.direction) {
        case 'North': 
          this.direction = 'East'; 
          this.y = centerY - offset; 
          this.x = centerX + 110; 
          this.angle = Math.PI / 2;
          break;
        case 'South': 
          this.direction = 'West'; 
          this.y = centerY + offset; 
          this.x = centerX - 110; 
          this.angle = -Math.PI / 2;
          break;
        case 'East': 
          this.direction = 'South'; 
          this.x = centerX + offset; 
          this.y = centerY + 110; 
          this.angle = Math.PI;
          break;
        case 'West': 
          this.direction = 'North'; 
          this.x = centerX - offset; 
          this.y = centerY - 110; 
          this.angle = 0;
          break;
      }
    }
  }

  update(targetSpeed: number, deltaTime: number, centerX?: number, centerY?: number) {
    // Apply reaction time variation (simple smoothing)
    const smoothing = Math.max(0.05, 1 - this.reactionTime);
    const adjustedTargetSpeed = this.speed + (targetSpeed - this.speed) * smoothing;

    if (adjustedTargetSpeed < this.speed) {
      this.speed = Math.max(adjustedTargetSpeed, this.speed - this.acceleration * 5 * deltaTime);
      this.isBraking = true;
    } else if (adjustedTargetSpeed > this.speed) {
      this.speed = Math.min(adjustedTargetSpeed, this.speed + this.acceleration * deltaTime);
      this.isBraking = false;
    } else {
      this.isBraking = false;
    }

    if (this.speed < 0.1) {
      this.isWaiting = true;
      this.waitTime += deltaTime;
      this.isBraking = true;
    } else {
      this.isWaiting = false;
    }

    // Lane change animation
    if (this.targetLaneIndex !== this.laneIndex) {
      this.laneChangeProgress += deltaTime * 2; // Takes 0.5s to change lane
      if (this.laneChangeProgress >= 1) {
        this.laneIndex = this.targetLaneIndex;
        this.laneChangeProgress = 0;
        this.lateralOffset = 0;
      } else {
        const laneWidth = 40;
        const directionMultiplier = this.targetLaneIndex > this.laneIndex ? 1 : -1;
        this.lateralOffset = directionMultiplier * laneWidth * this.laneChangeProgress;
      }
    }

    const moveStep = this.speed * deltaTime;
    
    if (this.isTurning && centerX !== undefined && centerY !== undefined) {
        const arcLength = this.turnRadius * Math.PI / 2;
        this.turnProgress += moveStep / arcLength;
        
        if (this.turnProgress >= 1) {
          this.completeTurn(centerX, centerY);
        } else {
          const sweep = this.turnAction === 'Left' ? -Math.PI / 2 : Math.PI / 2;
          const currentAngle = this.startAngle + sweep * this.turnProgress;
          
          this.x = this.turnCenter.x + Math.cos(currentAngle) * this.turnRadius;
          this.y = this.turnCenter.y + Math.sin(currentAngle) * this.turnRadius;
          
          // Update visual angle (tangent to the arc)
          this.angle = this.turnAction === 'Left' ? currentAngle : currentAngle + Math.PI;
        }
        this.distanceTraveled += moveStep;
    } else {
        switch (this.direction) {
          case 'North': this.y -= moveStep; this.angle = 0; break;
          case 'South': this.y += moveStep; this.angle = Math.PI; break;
          case 'East': this.x += moveStep; this.angle = Math.PI / 2; break;
          case 'West': this.x -= moveStep; this.angle = -Math.PI / 2; break;
        }
        this.distanceTraveled += moveStep;
    }
    
    this.lastSpeed = this.speed;
  }
}
