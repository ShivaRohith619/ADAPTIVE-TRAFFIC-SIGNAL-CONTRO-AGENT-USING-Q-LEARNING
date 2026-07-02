
import { Direction, SignalState } from './types';

export class TrafficSignal {
  direction: Direction;
  state: SignalState = 'Red';
  timer: number = 0;
  greenDuration: number = 10;
  yellowDuration: number = 3;

  constructor(direction: Direction) {
    this.direction = direction;
  }

  setGreen(duration: number) {
    this.state = 'Green';
    this.timer = duration;
    this.greenDuration = duration;
  }

  update(deltaTime: number): boolean {
    if (this.timer > 0) {
      this.timer -= deltaTime;
      if (this.timer <= 0) {
        if (this.state === 'Green') {
          this.state = 'Yellow';
          this.timer = this.yellowDuration;
          return false;
        } else if (this.state === 'Yellow') {
          this.state = 'Red';
          this.timer = 0;
          return true; // Finished cycle
        }
      }
    }
    return false;
  }
}
