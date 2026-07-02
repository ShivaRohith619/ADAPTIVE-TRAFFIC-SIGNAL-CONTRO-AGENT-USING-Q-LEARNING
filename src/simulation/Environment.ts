
import { Vehicle } from './Vehicle';
import { TrafficSignal } from './TrafficSignal';
import { QLearningAgent } from './QLearningAgent';
import { Direction, VehicleType, SimulationStats } from './types';

export class Environment {
  width: number = 800;
  height: number = 800;
  intersectionSize: number = 200;
  vehicles: Vehicle[] = [];
  signals: Record<Direction, TrafficSignal>;
  agent: QLearningAgent;
  
  stats: SimulationStats = {
    totalVehiclesPassed: 0,
    averageWaitTime: 0,
    currentReward: 0,
    episode: 0,
    epsilon: 0.2
  };

  private lastActionTime: number = 0;
  private actionInterval: number = 5000; // Decisions every 5 seconds
  private currentGreenDirection: Direction = 'North';
  private currentGreenDuration: number = 10;
  private isTransitioning: boolean = false;
  private totalWaitTimeSum: number = 0;
  private vehiclesCounted: number = 0;

  constructor() {
    this.signals = {
      North: new TrafficSignal('North'),
      South: new TrafficSignal('South'),
      East: new TrafficSignal('East'),
      West: new TrafficSignal('West')
    };
    this.agent = new QLearningAgent();
    this.resetSignals();
  }

  resetSignals() {
    Object.values(this.signals).forEach(s => {
      if (s.direction === this.currentGreenDirection) {
        s.setGreen(this.currentGreenDuration);
      } else {
        s.state = 'Red';
        s.timer = 0;
      }
    });
  }

  spawnVehicle(density: number) {
    if (Math.random() > density) return;

    const directions: Direction[] = ['North', 'South', 'East', 'West'];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const lane = Math.floor(Math.random() * 2);
    const types: VehicleType[] = ['Car', 'Car', 'Car', 'Bus', 'Bike', 'Ambulance', 'AutoRickshaw', 'AutoRickshaw'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let x, y;
    const offset = 30 + lane * 40;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    switch (dir) {
      case 'North': x = centerX - offset; y = this.height; break; // Coming from bottom, drive on left
      case 'South': x = centerX + offset; y = 0; break; // Coming from top, drive on left
      case 'East': x = 0; y = centerY - offset; break; // Coming from left, drive on left
      case 'West': x = this.width; y = centerY + offset; break; // Coming from right, drive on left
    }

    // Check if space is available to spawn
    const tooClose = this.vehicles.some(v => 
      v.direction === dir && 
      v.laneIndex === lane && 
      Math.sqrt(Math.pow(v.x - x, 2) + Math.pow(v.y - y, 2)) < 100
    );

    if (!tooClose) {
      const vehicle = new Vehicle(Math.random().toString(36).substr(2, 9), type, dir, lane, x, y);
      
      // Assign turn action based on lane (Indian rules: Left-Hand Traffic)
      // Lane 1 (Outer/Left): Left turn or Straight
      // Lane 0 (Inner/Right): Right turn or Straight
      const rand = Math.random();
      if (lane === 1) {
        vehicle.turnAction = rand < 0.3 ? 'Left' : 'Straight';
      } else {
        vehicle.turnAction = rand < 0.3 ? 'Right' : 'Straight';
      }
      
      this.vehicles.push(vehicle);
    }
  }

  getLaneStats(): { counts: number[], waitTimes: number[] } {
    const counts = [0, 0, 0, 0]; // N, S, E, W
    const waitSums = [0, 0, 0, 0];
    const dirToIndex: Record<Direction, number> = { North: 0, South: 1, East: 2, West: 3 };

    this.vehicles.forEach(v => {
      if (!v.hasPassedIntersection) {
        const idx = dirToIndex[v.direction];
        counts[idx]++;
        if (v.isWaiting) waitSums[idx] += v.waitTime;
      }
    });

    const avgWaitTimes = waitSums.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
    return { counts, waitTimes: avgWaitTimes };
  }

  calculateReward(counts: number[], waitTimes: number[]): number {
    const totalQueue = counts.reduce((a, b) => a + b, 0);
    const totalWait = waitTimes.reduce((a, b) => a + b, 0);
    const ambulanceWaiting = this.vehicles.filter(v => v.isWaiting && v.type === 'Ambulance').length;
    
    // Reward is negative of congestion and delay
    return -(totalQueue * 1 + totalWait * 0.5 + ambulanceWaiting * 20);
  }

  update(deltaTime: number, density: number) {
    this.spawnVehicle(density);

    const currentTime = Date.now();

    // Emergency Vehicle Priority
    const ambulance = this.vehicles.find(v => v.type === 'Ambulance' && !v.hasPassedIntersection);
    let forceTransition = false;
    let targetDirection: Direction | null = null;

    if (ambulance && !this.isTransitioning && this.currentGreenDirection !== ambulance.direction) {
      forceTransition = true;
      targetDirection = ambulance.direction;
    }

    // Check if current signal has finished its duration
    const currentSignal = this.signals[this.currentGreenDirection];
    const signalFinished = currentSignal.state === 'Red';

    if ((forceTransition || signalFinished || (currentTime - this.lastActionTime > 20000)) && !this.isTransitioning) {
      const { counts, waitTimes } = this.getLaneStats();
      const dirToIndex: Record<Direction, number> = { North: 0, South: 1, East: 2, West: 3 };
      const stateKey = this.agent.getStateKey(counts, waitTimes, dirToIndex[this.currentGreenDirection]);
      
      let action: number;
      if (forceTransition) {
        // Forced action: target direction with default 10s duration (index 1)
        action = dirToIndex[targetDirection!] * 3 + 1;
      } else {
        action = this.agent.chooseAction(stateKey);
      }
      
      const reward = this.calculateReward(counts, waitTimes);
      this.stats.currentReward = reward;

      // Decode action
      const directions: Direction[] = ['North', 'South', 'East', 'West'];
      const durations = [5, 10, 15];
      const newGreenDirection = directions[Math.floor(action / 3)];
      const newDuration = durations[action % 3];
      
      if (newGreenDirection !== this.currentGreenDirection) {
        this.isTransitioning = true;
        // Start Yellow transition
        Object.values(this.signals).forEach(s => {
          if (s.state === 'Green') {
            s.state = 'Yellow';
            s.timer = 3;
          }
        });
      } else {
        // Same direction, just refresh duration
        this.currentGreenDuration = newDuration;
        currentSignal.setGreen(newDuration);
      }

      const { counts: nextCounts, waitTimes: nextWaitTimes } = this.getLaneStats();
      const nextStateKey = this.agent.getStateKey(nextCounts, nextWaitTimes, Math.floor(action / 3));
      
      this.agent.updateQTable(stateKey, action, reward, nextStateKey);
      
      // Epsilon decay
      if (this.agent.epsilon > 0.05) {
        this.agent.epsilon *= 0.995;
      }
      
      this.lastActionTime = currentTime;
      this.currentGreenDirection = newGreenDirection;
      this.currentGreenDuration = newDuration;
    }

    // Update signals
    let allFinished = true;
    Object.values(this.signals).forEach(s => {
      const finished = s.update(deltaTime / 1000);
      if (!finished && s.state !== 'Red') allFinished = false;
    });

    if (this.isTransitioning && allFinished) {
      this.isTransitioning = false;
      this.resetSignals();
    }

    // Update vehicles
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const stopLineOffset = 110;

    this.vehicles.forEach((v, index) => {
      let targetSpeed = v.maxSpeed;
      let stopLine = 0;

      // Determine stop line and signal
      let signal: TrafficSignal;
      switch (v.direction) {
        case 'North': 
          stopLine = centerY + stopLineOffset; 
          signal = this.signals.North;
          if (v.y <= stopLine && v.y > centerY - stopLineOffset) v.hasPassedIntersection = true;
          break;
        case 'South': 
          stopLine = centerY - stopLineOffset; 
          signal = this.signals.South;
          if (v.y >= stopLine && v.y < centerY + stopLineOffset) v.hasPassedIntersection = true;
          break;
        case 'East': 
          stopLine = centerX - stopLineOffset; 
          signal = this.signals.East;
          if (v.x >= stopLine && v.x < centerX + stopLineOffset) v.hasPassedIntersection = true;
          break;
        case 'West': 
          stopLine = centerX + stopLineOffset; 
          signal = this.signals.West;
          if (v.x <= stopLine && v.x > centerX - stopLineOffset) v.hasPassedIntersection = true;
          break;
      }

      // Traffic light logic
      if (!v.hasPassedIntersection && !v.isTurning) {
        const distToStop = Math.abs((v.direction === 'North' || v.direction === 'South' ? v.y : v.x) - stopLine);
        if (distToStop < 250) {
          if (signal!.state === 'Red') {
            // Indian Rule: Free Left Turn (proceed slowly and yield)
            if (v.turnAction === 'Left') {
              targetSpeed = v.maxSpeed * 0.3;
            } else {
              targetSpeed = 0;
            }
          }
          else if (signal!.state === 'Yellow') targetSpeed = v.maxSpeed * 0.4;
        }
      }

      // Car following logic
      this.vehicles.forEach(other => {
        if (v === other) return;
        if (v.direction === other.direction && v.targetLaneIndex === other.targetLaneIndex) {
          let dist = Infinity;
          switch (v.direction) {
            case 'North': if (other.y < v.y) dist = v.y - other.y; break;
            case 'South': if (other.y > v.y) dist = other.y - v.y; break;
            case 'East': if (other.x > v.x) dist = other.x - v.x; break;
            case 'West': if (other.x < v.x) dist = v.x - other.x; break;
          }
          if (dist < v.length + 100) targetSpeed = Math.min(targetSpeed, other.speed * 0.8);
          if (dist < v.length + 40) targetSpeed = 0;
        }
      });

      // Lane changing logic
      if (!v.hasPassedIntersection && v.targetLaneIndex === v.laneIndex && Math.random() < 0.01) {
        const otherLane = 1 - v.laneIndex;
        const vehiclesInCurrentLane = this.vehicles.filter(other => other.direction === v.direction && other.laneIndex === v.laneIndex && !other.hasPassedIntersection).length;
        const vehiclesInOtherLane = this.vehicles.filter(other => other.direction === v.direction && other.laneIndex === otherLane && !other.hasPassedIntersection).length;

        if (vehiclesInOtherLane < vehiclesInCurrentLane - 1) {
          // Check if space is available in the other lane
          const spaceAvailable = !this.vehicles.some(other => {
            if (other === v || other.direction !== v.direction || other.laneIndex !== otherLane) return false;
            const dist = Math.sqrt(Math.pow(v.x - other.x, 2) + Math.pow(v.y - other.y, 2));
            return dist < 60;
          });

          if (spaceAvailable) {
            v.targetLaneIndex = otherLane;
          }
        }
      }

      v.update(targetSpeed, deltaTime / 1000, centerX, centerY);

      // Handle turning movement
      if (!v.hasPassedIntersection && !v.isTurning && v.speed > 0) {
          const pos = (v.direction === 'North' || v.direction === 'South' ? v.y : v.x);
          const distToStop = Math.abs(pos - stopLine);
          
          // Check if vehicle has reached the turn initiation point (near the stop line)
          if (distToStop < 40 && v.turnAction !== 'Straight') {
              // Right turns ONLY on Green. Left turns allowed on Green or Red (Free Left).
              const canTurn = (signal!.state === 'Green') || (v.turnAction === 'Left');
              
              if (canTurn) {
                  v.startTurn(centerX, centerY);
              }
          }
      }

      // Remove vehicles that left
      if (v.x < -100 || v.x > this.width + 100 || v.y < -100 || v.y > this.height + 100) {
        if (v.hasPassedIntersection) {
          this.stats.totalVehiclesPassed++;
          this.totalWaitTimeSum += v.waitTime;
          this.vehiclesCounted++;
          this.stats.averageWaitTime = this.totalWaitTimeSum / this.vehiclesCounted;
        }
        this.vehicles.splice(index, 1);
      }
    });

    this.stats.epsilon = this.agent.epsilon;
  }
}
