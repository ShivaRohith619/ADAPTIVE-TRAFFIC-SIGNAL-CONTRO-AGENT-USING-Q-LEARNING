
import React, { useState, useEffect, useRef } from 'react';
import { Environment } from './simulation/Environment';
import SimulationCanvas from './components/SimulationCanvas';
import Analytics from './components/Analytics';
import { Play, Pause, RotateCcw, Activity, Settings, Cpu, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [env] = useState(() => new Environment());
  const [isRunning, setIsRunning] = useState(true);
  const [density, setDensity] = useState(0.1);
  const [simSpeed, setSimSpeed] = useState(1);
  const [history, setHistory] = useState<{ episode: number; reward: number; waitTime: number }[]>([]);
  const [stats, setStats] = useState(env.stats);
  
  const lastUpdateRef = useRef(Date.now());
  const episodeTimerRef = useRef(0);
  const EPISODE_DURATION = 30000; // 30 seconds per episode for analytics

  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      if (isRunning) {
        const now = Date.now();
        const deltaTime = (now - lastUpdateRef.current) * simSpeed;
        lastUpdateRef.current = now;

        env.update(deltaTime, density);
        setStats({ ...env.stats });

        episodeTimerRef.current += deltaTime;
        if (episodeTimerRef.current >= EPISODE_DURATION) {
          setHistory(prev => [
            ...prev,
            {
              episode: prev.length + 1,
              reward: env.stats.currentReward,
              waitTime: env.stats.averageWaitTime
            }
          ].slice(-20)); // Keep last 20 episodes
          episodeTimerRef.current = 0;
          env.stats.episode++;
        }
      } else {
        lastUpdateRef.current = Date.now();
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, density, simSpeed, env]);

  const resetSimulation = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="text-neutral-950 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">AI Traffic Control</h1>
              <p className="text-xs text-neutral-400 font-mono">Q-LEARNING ADAPTIVE SYSTEM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-neutral-800 rounded-lg p-1 border border-white/5">
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`p-2 rounded-md transition-all ${isRunning ? 'bg-neutral-700 text-white' : 'hover:bg-neutral-700 text-neutral-400'}`}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button 
                onClick={resetSimulation}
                className="p-2 rounded-md hover:bg-neutral-700 text-neutral-400 transition-all"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulation View */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="aspect-square bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
            <SimulationCanvas env={env} />
            
            {/* Overlay Stats */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-neutral-950/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono">EPISODE {stats.episode}</span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 bg-neutral-950/80 backdrop-blur-md border border-white/10 p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase font-bold">Exploration Rate</p>
                  <p className="text-sm font-mono text-blue-400">{(stats.epsilon * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase font-bold">Current Reward</p>
                  <p className="text-sm font-mono text-emerald-400">{stats.currentReward.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lane Status */}
          <div className="grid grid-cols-4 gap-4">
            {['North', 'South', 'East', 'West'].map((dir) => {
              const count = env.vehicles.filter(v => v.direction === dir && !v.hasPassedIntersection).length;
              const isGreen = env.signals[dir as any].state === 'Green';
              return (
                <div key={dir} className="bg-neutral-900 border border-white/5 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-400">{dir}</span>
                    <div className={`w-2 h-2 rounded-full ${isGreen ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 opacity-30'}`} />
                  </div>
                  <p className="text-2xl font-mono">{count}</p>
                  <p className="text-[10px] text-neutral-500 uppercase">Vehicles in Queue</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Controls & Analytics */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Controls */}
          <section className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Settings size={18} className="text-neutral-400" />
              <h2 className="font-semibold">Simulation Parameters</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs text-neutral-400 uppercase font-bold">Traffic Density</label>
                  <span className="text-xs font-mono text-emerald-400">{(density * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.01" max="0.4" step="0.01" 
                  value={density} onChange={(e) => setDensity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs text-neutral-400 uppercase font-bold">Simulation Speed</label>
                  <span className="text-xs font-mono text-blue-400">{simSpeed}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="5" step="0.5" 
                  value={simSpeed} onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-3">
              <div className="bg-neutral-800/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu size={14} className="text-purple-400" />
                  <span className="text-[10px] text-neutral-400 uppercase">Agent</span>
                </div>
                <p className="text-xs font-medium">Q-Learning</p>
              </div>
              <div className="bg-neutral-800/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Car size={14} className="text-orange-400" />
                  <span className="text-[10px] text-neutral-400 uppercase">Logic</span>
                </div>
                <p className="text-xs font-medium">Car-Following</p>
              </div>
            </div>
          </section>

          {/* Analytics */}
          <section className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-6">
              <Activity size={18} className="text-neutral-400" />
              <h2 className="font-semibold">Performance Metrics</h2>
            </div>
            <Analytics history={history} stats={stats} />
          </section>
        </div>
      </main>
    </div>
  );
}
