
import React, { useRef, useEffect } from 'react';
import { Environment } from '../simulation/Environment';
import { Vehicle } from '../simulation/Vehicle';

interface SimulationCanvasProps {
  env: Environment;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ env }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = env;
    const centerX = width / 2;
    const centerY = height / 2;
    const roadWidth = 200;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw Roads
    ctx.fillStyle = '#333';
    // Horizontal road
    ctx.fillRect(0, centerY - roadWidth / 2, width, roadWidth);
    // Vertical road
    ctx.fillRect(centerX - roadWidth / 2, 0, roadWidth, height);

    // Lane Markings
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([20, 20]);
    ctx.lineWidth = 2;

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(centerX - roadWidth / 2, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + roadWidth / 2, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, centerY - roadWidth / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + roadWidth / 2);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Lane dividers (solid)
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    // Horizontal lanes
    ctx.beginPath(); ctx.moveTo(0, centerY - 50); ctx.lineTo(centerX - 100, centerY - 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, centerY + 50); ctx.lineTo(centerX - 100, centerY + 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX + 100, centerY - 50); ctx.lineTo(width, centerY - 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX + 100, centerY + 50); ctx.lineTo(width, centerY + 50); ctx.stroke();
    // Vertical lanes
    ctx.beginPath(); ctx.moveTo(centerX - 50, 0); ctx.lineTo(centerX - 50, centerY - 100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX + 50, 0); ctx.lineTo(centerX + 50, centerY - 100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX - 50, centerY + 100); ctx.lineTo(centerX - 50, height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX + 50, centerY + 100); ctx.lineTo(centerX + 50, height); ctx.stroke();

    // Zebra Crossings
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const zebraWidth = 15;
    const zebraCount = 10;
    for (let i = 0; i < zebraCount; i++) {
        // North
        ctx.fillRect(centerX - 100 + i * 20, centerY - 130, 10, 30);
        // South
        ctx.fillRect(centerX - 100 + i * 20, centerY + 100, 10, 30);
        // East
        ctx.fillRect(centerX + 100, centerY - 100 + i * 20, 30, 10);
        // West
        ctx.fillRect(centerX - 130, centerY - 100 + i * 20, 30, 10);
    }

    // Stop Lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(centerX - 100, centerY - 100); ctx.lineTo(centerX + 100, centerY - 100); ctx.stroke(); // Top
    ctx.beginPath(); ctx.moveTo(centerX - 100, centerY + 100); ctx.lineTo(centerX + 100, centerY + 100); ctx.stroke(); // Bottom
    ctx.beginPath(); ctx.moveTo(centerX - 100, centerY - 100); ctx.lineTo(centerX - 100, centerY + 100); ctx.stroke(); // Left
    ctx.beginPath(); ctx.moveTo(centerX + 100, centerY - 100); ctx.lineTo(centerX + 100, centerY + 100); ctx.stroke(); // Right

    // Traffic Lights
    const drawLight = (x: number, y: number, state: string, dir: string) => {
      ctx.fillStyle = '#222';
      ctx.fillRect(x - 15, y - 15, 30, 30);
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = state === 'Green' ? '#10b981' : state === 'Yellow' ? '#f59e0b' : '#ef4444';
      ctx.fill();
      // Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Timer
      ctx.fillStyle = '#fff';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      const timer = Math.ceil(env.signals[dir as any].timer);
      if (timer > 0) ctx.fillText(timer.toString(), x, y + 5);
    };

    drawLight(centerX - 120, centerY - 120, env.signals.South.state, 'South'); // Top-Left (controlling Southbound)
    drawLight(centerX + 120, centerY + 120, env.signals.North.state, 'North'); // Bottom-Right (controlling Northbound)
    drawLight(centerX + 120, centerY - 120, env.signals.West.state, 'West'); // Top-Right (controlling Westbound)
    drawLight(centerX - 120, centerY + 120, env.signals.East.state, 'East'); // Bottom-Left (controlling Eastbound)

    // Vehicles
    const drawVehicle = (v: Vehicle) => {
      ctx.save();
      
      // Apply lateral offset for lane changing
      let drawX = v.x;
      let drawY = v.y;
      switch (v.direction) {
        case 'North': drawX += v.lateralOffset; break;
        case 'South': drawX -= v.lateralOffset; break;
        case 'East': drawY += v.lateralOffset; break;
        case 'West': drawY -= v.lateralOffset; break;
      }
      
      ctx.translate(drawX, drawY);
      ctx.rotate(v.angle);
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(-v.width/2 + 2, -v.length/2 + 2, v.width, v.length);

      // Body
      ctx.fillStyle = v.color;
      const radius = v.type === 'Bus' ? 4 : 8;
      
      // Rounded body
      ctx.beginPath();
      ctx.roundRect(-v.width / 2, -v.length / 2, v.width, v.length, radius);
      ctx.fill();
      
      // Turn Signal
      if (v.turnAction !== 'Straight' && !v.hasPassedIntersection) {
          const flash = Math.floor(Date.now() / 300) % 2 === 0;
          if (flash) {
              ctx.fillStyle = '#fbbf24';
              if (v.turnAction === 'Left') {
                  ctx.beginPath();
                  ctx.arc(-v.width/2, -v.length/2 + 5, 3, 0, Math.PI * 2);
                  ctx.fill();
              } else {
                  ctx.beginPath();
                  ctx.arc(v.width/2, -v.length/2 + 5, 3, 0, Math.PI * 2);
                  ctx.fill();
              }
          }
      }

      // Details based on type
      if (v.type === 'Car') {
        // Roof
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(-v.width/2 + 2, -v.length/4, v.width - 4, v.length/2);
        // Windshield
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-v.width/2 + 3, -v.length/4 - 2, v.width - 6, 4);
        // Rear window
        ctx.fillRect(-v.width/2 + 3, v.length/4 - 2, v.width - 6, 4);
        // Headlights
        ctx.fillStyle = '#fef9c3';
        ctx.fillRect(-v.width/2 + 2, -v.length/2, 4, 2);
        ctx.fillRect(v.width/2 - 6, -v.length/2, 4, 2);
      } else if (v.type === 'Bus') {
        // Windows
        ctx.fillStyle = '#94a3b8';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(-v.width/2 + 2, -v.length/2 + 10 + i * 14, v.width - 4, 8);
        }
        // Roof details
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(-2, -v.length/2 + 5, 4, v.length - 10);
      } else if (v.type === 'Bike') {
        // Rider
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        // Helmet
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (v.type === 'Ambulance') {
        // Red cross
        ctx.fillStyle = '#ef4444';
        const crossSize = 12;
        ctx.fillRect(-2, -crossSize/2, 4, crossSize);
        ctx.fillRect(-crossSize/2, -2, crossSize, 4);
        
        // Siren lights (flashing)
        const flash = Math.floor(Date.now() / 200) % 2 === 0;
        ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
        ctx.fillRect(-v.width/2, -v.length/2, 6, 4);
        ctx.fillStyle = flash ? '#3b82f6' : '#ef4444';
        ctx.fillRect(v.width/2 - 6, -v.length/2, 6, 4);
        
        // Windows
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-v.width/2 + 2, -v.length/2 + 8, v.width - 4, 6);
      } else if (v.type === 'AutoRickshaw') {
        // Roof (yellow)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(-v.width/2, -v.length/2, v.width, v.length, 5);
        ctx.fill();
        // Body (black/green)
        ctx.fillStyle = '#1a2e05'; // Dark green
        ctx.fillRect(-v.width/2, 0, v.width, v.length/2);
        // Front wheel
        ctx.fillStyle = '#000';
        ctx.fillRect(-2, -v.length/2 - 2, 4, 6);
        // Windows/Open sides
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-v.width/2 + 2, -v.length/4, v.width - 4, v.length/2);
      }

      // Horn effect (Indian traffic flavor)
      if (v.isWaiting && Math.random() < 0.05) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('HORN!', v.width/2 + 5, 0);
      }

      // Braking lights
      if (v.isBraking) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-v.width / 2 + 3, v.length / 2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(v.width / 2 - 3, v.length / 2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    };

    env.vehicles.forEach(drawVehicle);
  };

  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) draw(ctx);
      }
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [env]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={800}
      className="w-full h-full object-contain bg-neutral-900 rounded-2xl shadow-2xl"
    />
  );
};

export default SimulationCanvas;
