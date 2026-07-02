
export type Direction = 'North' | 'South' | 'East' | 'West';

export type SignalState = 'Green' | 'Yellow' | 'Red';

export interface LaneStats {
  vehicleCount: number;
  waitingTime: number;
  queueLength: number;
}

export interface SimulationStats {
  totalVehiclesPassed: number;
  averageWaitTime: number;
  currentReward: number;
  episode: number;
  epsilon: number;
}

export type VehicleType = 'Car' | 'Bus' | 'Bike' | 'Ambulance' | 'AutoRickshaw';

export type TurnAction = 'Straight' | 'Left' | 'Right';

export interface VehicleConfig {
  type: VehicleType;
  width: number;
  length: number;
  maxSpeed: number;
  acceleration: number;
  color: string;
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  Car: { type: 'Car', width: 20, length: 40, maxSpeed: 180, acceleration: 120, color: '#3b82f6' },
  Bus: { type: 'Bus', width: 25, length: 80, maxSpeed: 120, acceleration: 60, color: '#ef4444' },
  Bike: { type: 'Bike', width: 12, length: 25, maxSpeed: 240, acceleration: 240, color: '#10b981' },
  Ambulance: { type: 'Ambulance', width: 22, length: 50, maxSpeed: 300, acceleration: 360, color: '#ffffff' },
  AutoRickshaw: { type: 'AutoRickshaw', width: 18, length: 30, maxSpeed: 150, acceleration: 180, color: '#fbbf24' },
};
