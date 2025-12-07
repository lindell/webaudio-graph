import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Trash2, Volume2, Activity, Speaker, Sliders, BarChart3, Globe, Cpu, Save, Code } from 'lucide-react';

// --- Types & Constants ---
type NodeType = 'oscillator' | 'gain' | 'delay' | 'panner' | 'analyser' | 'worklet' | 'destination';

const DEFAULT_WORKLET_CODE = `process(inputs, outputs, parameters) {
  const output = outputs[0];
  // Simple White Noise Generator
  output.forEach(channel => {
    for (let i = 0; i < channel.length; i++) {
      channel[i] = (Math.random() * 2 - 1) * 0.2;
    }
  });
  return true;
}`;

// --- Class Hierarchy (Mutable) ---

abstract class BaseNode {
  constructor(public id: string, public x: number, public y: number) { }

  abstract get type(): NodeType;
  abstract get label(): string;

  abstract createAudioNode(ctx: AudioContext, engine: AudioEngine): AudioNode | Promise<AudioNode> | null;
  // Updated signature: accepts partial params object
  abstract updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<this>): void;

  // No clone() needed! We mutate x/y directly.
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class OscillatorNodeData extends BaseNode {
  readonly type = 'oscillator';
  readonly label = 'Oscillator';

  constructor(
    id: string, x: number, y: number,
    public frequency: number = 440,
    public waveType: OscillatorType = 'sine'
  ) { super(id, x, y); }

  createAudioNode(ctx: AudioContext): AudioNode {
    const osc = ctx.createOscillator();
    osc.type = this.waveType;
    osc.frequency.value = this.frequency;
    osc.start();
    return osc;
  }

  updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<OscillatorNodeData>) {
    const osc = node as OscillatorNode;
    if (params.frequency !== undefined) osc.frequency.setTargetAtTime(params.frequency, ctx.currentTime, 0.02);
    if (params.waveType !== undefined) osc.type = params.waveType;
  }
}

class GainNodeData extends BaseNode {
  readonly type = 'gain';
  readonly label = 'Gain';

  constructor(id: string, x: number, y: number, public gain: number = 0.5) { super(id, x, y); }

  createAudioNode(ctx: AudioContext): AudioNode {
    const g = ctx.createGain();
    g.gain.value = this.gain;
    return g;
  }

  updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<GainNodeData>) {
    const g = node as GainNode;
    if (params.gain !== undefined) g.gain.setTargetAtTime(params.gain, ctx.currentTime, 0.02);
  }
}

class DelayNodeData extends BaseNode {
  readonly type = 'delay';
  readonly label = 'Delay';

  constructor(id: string, x: number, y: number, public delayTime: number = 0.3) { super(id, x, y); }

  createAudioNode(ctx: AudioContext): AudioNode {
    const d = ctx.createDelay(5.0);
    d.delayTime.value = this.delayTime;
    return d;
  }

  updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<DelayNodeData>) {
    const d = node as DelayNode;
    if (params.delayTime !== undefined) d.delayTime.setTargetAtTime(params.delayTime, ctx.currentTime, 0.02);
  }
}

class PannerNodeData extends BaseNode {
  readonly type = 'panner';
  readonly label = 'Spatial Pan';

  constructor(
    id: string, x: number, y: number,
    public positionX: number = 0,
    public positionY: number = 0,
    public positionZ: number = 0,
    public panningModel: PanningModelType = 'HRTF'
  ) { super(id, x, y); }

  createAudioNode(ctx: AudioContext): AudioNode {
    const p = ctx.createPanner();
    p.panningModel = this.panningModel;
    p.distanceModel = 'inverse';
    p.positionX.value = this.positionX;
    p.positionY.value = this.positionY;
    p.positionZ.value = this.positionZ;
    return p;
  }

  updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<PannerNodeData>) {
    const p = node as PannerNode;
    if (params.positionX !== undefined) p.positionX.setTargetAtTime(params.positionX, ctx.currentTime, 0.02);
    if (params.positionY !== undefined) p.positionY.setTargetAtTime(params.positionY, ctx.currentTime, 0.02);
    if (params.positionZ !== undefined) p.positionZ.setTargetAtTime(params.positionZ, ctx.currentTime, 0.02);
    if (params.panningModel !== undefined) p.panningModel = params.panningModel;
  }
}

class AnalyserNodeData extends BaseNode {
  readonly type = 'analyser';
  readonly label = 'Analyser';

  constructor(id: string, x: number, y: number) { super(id, x, y); }

  createAudioNode(ctx: AudioContext, engine: AudioEngine): AudioNode {
    const a = ctx.createAnalyser();
    a.fftSize = 2048;
    engine.analyserBuffers.set(this.id, new Uint8Array(a.frequencyBinCount));
    return a;
  }

  updateAudioParam() { }
}

class WorkletNodeData extends BaseNode {
  readonly type = 'worklet';
  readonly label = 'Worklet';

  constructor(
    id: string, x: number, y: number,
    public code: string = DEFAULT_WORKLET_CODE,
    public codeVersion: number = 0
  ) { super(id, x, y); }

  async createAudioNode(ctx: AudioContext): Promise<AudioNode> {
    const processorName = `processor-${this.id}-${this.codeVersion}`;
    const blobContent = `
      class CustomProcessor extends AudioWorkletProcessor {
        ${this.code}
      }
      registerProcessor('${processorName}', CustomProcessor);
    `;

    const blob = new Blob([blobContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    try {
      await ctx.audioWorklet.addModule(url);
      const node = new AudioWorkletNode(ctx, processorName);
      node.onprocessorerror = (e) => console.error("Worklet Error", e);
      return node;
    } catch (e) {
      console.error("Failed to load worklet", e);
      throw e;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  updateAudioParam() { }
}

class DestinationNodeData extends BaseNode {
  readonly type = 'destination';
  readonly label = 'Speakers';
  constructor(id: string, x: number, y: number) { super(id, x, y); }
  createAudioNode(ctx: AudioContext): AudioNode { return ctx.destination; }
  updateAudioParam() { }
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

// --- Audio Engine ---
class AudioEngine {
  ctx: AudioContext | null = null;
  nodes: Map<string, AudioNode> = new Map();
  analyserBuffers: Map<string, Uint8Array> = new Map();

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  async createNode(data: BaseNode) {
    if (!this.ctx) return;
    if (this.nodes.has(data.id) && data.type !== 'worklet') return;

    let audioNode: AudioNode | null = null;
    if (data instanceof WorkletNodeData) {
      try {
        audioNode = await data.createAudioNode(this.ctx);
        const oldNode = this.nodes.get(data.id);
        if (oldNode) oldNode.disconnect();
      } catch (e) { return; }
    } else {
      const result = data.createAudioNode(this.ctx, this);
      if (result instanceof AudioNode) audioNode = result;
    }

    if (audioNode) this.nodes.set(data.id, audioNode);
  }

  updateParam(data: BaseNode, params: any) {
    if (!this.ctx) return;
    const audioNode = this.nodes.get(data.id);
    if (audioNode) data.updateAudioParam(this.ctx, audioNode, params);
  }

  getAnalyserData(id: string): Uint8Array | null {
    const node = this.nodes.get(id);
    const buffer = this.analyserBuffers.get(id);
    if (node instanceof AnalyserNode && buffer) {
      node.getByteFrequencyData(buffer as any);
      return buffer;
    }
    return null;
  }

  connect(fromId: string, toId: string) {
    const src = this.nodes.get(fromId);
    const dst = this.nodes.get(toId);
    if (src && dst) { try { src.connect(dst); } catch (e) { } }
  }

  disconnect(fromId: string, toId: string) {
    const src = this.nodes.get(fromId);
    const dst = this.nodes.get(toId);
    if (src && dst) { try { src.disconnect(dst); } catch (e) { } }
  }

  removeNode(id: string) {
    const node = this.nodes.get(id);
    if (node) {
      node.disconnect();
      if (node instanceof OscillatorNode) try { node.stop(); } catch (e) { }
      this.nodes.delete(id);
      this.analyserBuffers.delete(id);
    }
  }
}

// --- Components (Same as before, just reused) ---
const NODE_WIDTH = 220;
const NODE_WIDTH_LARGE = 320;
const HEADER_HEIGHT = 40;

const NodeShell = ({ node, children, onDelete, onStartWire, onEndWire, onMouseDown }: any) => {
  const width = node.type === 'worklet' ? NODE_WIDTH_LARGE : NODE_WIDTH;
  let colorClass = 'border-slate-500', titleClass = 'bg-slate-600', Icon = Activity;

  if (node instanceof OscillatorNodeData) { colorClass = 'border-emerald-500 shadow-emerald-900/20'; titleClass = 'bg-emerald-600'; Icon = Activity; }
  else if (node instanceof GainNodeData) { colorClass = 'border-amber-500 shadow-amber-900/20'; titleClass = 'bg-amber-600'; Icon = Volume2; }
  else if (node instanceof DelayNodeData) { colorClass = 'border-purple-500 shadow-purple-900/20'; titleClass = 'bg-purple-600'; Icon = Sliders; }
  else if (node instanceof PannerNodeData) { colorClass = 'border-cyan-500 shadow-cyan-900/20'; titleClass = 'bg-cyan-600'; Icon = Globe; }
  else if (node instanceof AnalyserNodeData) { colorClass = 'border-orange-500 shadow-orange-900/20'; titleClass = 'bg-orange-600'; Icon = BarChart3; }
  else if (node instanceof WorkletNodeData) { colorClass = 'border-pink-500 shadow-pink-900/20'; titleClass = 'bg-pink-600'; Icon = Cpu; }
  else if (node instanceof DestinationNodeData) { colorClass = 'border-rose-500 shadow-rose-900/20'; titleClass = 'bg-rose-600'; Icon = Speaker; }

  return (
    <div className={`absolute rounded-lg shadow-xl backdrop-blur-md bg-slate-800/90 border-2 flex flex-col select-none group z-20 ${colorClass}`} style={{ left: node.x, top: node.y, width }}>
      <div className={`h-10 flex items-center justify-between px-3 rounded-t-md cursor-grab active:cursor-grabbing ${titleClass}`} onMouseDown={(e) => onMouseDown(e, node.id)}>
        <div className="flex items-center gap-2 text-white font-semibold text-xs uppercase tracking-wider"><Icon size={14} /> {node.label}</div>
        {node.type !== 'destination' && <button onMouseDown={(e) => { e.stopPropagation(); onDelete(node.id); }} className="text-white/50 hover:text-white transition-colors"><Trash2 size={14} /></button>}
      </div>
      {node.type !== 'oscillator' && <div className="absolute left-[-8px] top-3 w-4 h-4 bg-slate-300 border-2 border-slate-600 rounded-full cursor-crosshair hover:scale-125 transition-transform hover:bg-blue-400 z-30" onMouseUp={(e) => onEndWire(e, node.id)} title="Input" />}
      {node.type !== 'destination' && <div className="absolute right-[-8px] top-3 w-4 h-4 bg-slate-300 border-2 border-slate-600 rounded-full cursor-crosshair hover:scale-125 transition-transform hover:bg-green-400 z-30" onMouseDown={(e) => onStartWire(e, node.id)} title="Output" />}
      <div className="p-3 space-y-3 text-xs">{children}</div>
    </div>
  );
};

// Parameter Components - Updated to pass parameter objects
const OscillatorControls = ({ node, onUpdate }: any) => (
  <>
    <div className="flex justify-between items-center text-slate-400">
      <span>Type</span>
      <select
        className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-slate-200 outline-none"
        value={node.waveType}
        onChange={(e) => onUpdate(node.id, { waveType: e.target.value })}
      >
        {['sine', 'square', 'sawtooth', 'triangle'].map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
    <div className="space-y-1">
      <div className="flex justify-between text-slate-400"><span>Freq</span><span>{Math.round(node.frequency)} Hz</span></div>
      <input
        type="range" min="55" max="880" step="1"
        className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        value={node.frequency}
        onChange={(e) => onUpdate(node.id, { frequency: Number(e.target.value) })}
      />
    </div>
  </>
);

const GainControls = ({ node, onUpdate }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-slate-400"><span>Gain</span><span>{node.gain.toFixed(2)}</span></div>
    <input
      type="range" min="0" max="1" step="0.01"
      className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      value={node.gain}
      onChange={(e) => onUpdate(node.id, { gain: Number(e.target.value) })}
    />
  </div>
);

const DelayControls = ({ node, onUpdate }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-slate-400"><span>Time</span><span>{node.delayTime.toFixed(2)}s</span></div>
    <input
      type="range" min="0" max="2" step="0.01"
      className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      value={node.delayTime}
      onChange={(e) => onUpdate(node.id, { delayTime: Number(e.target.value) })}
    />
  </div>
);

const PannerControls = ({ node, onUpdate }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-slate-400">
      <span>Model</span>
      <select
        className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-slate-200 outline-none"
        value={node.panningModel}
        onChange={(e) => onUpdate(node.id, { panningModel: e.target.value })}
      >
        <option value="HRTF">HRTF</option><option value="equalpower">EqualPower</option>
      </select>
    </div>
    {['positionX', 'positionY', 'positionZ'].map((axis) => (
      <div key={axis} className="space-y-1">
        <div className="flex justify-between text-slate-400"><span>{axis.replace('position', '')}</span></div>
        <input
          type="range" min="-10" max="10" step="0.1"
          className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          value={(node as any)[axis]}
          onChange={(e) => onUpdate(node.id, { [axis]: Number(e.target.value) })}
        />
      </div>
    ))}
  </div>
);

const AnalyserControls = ({ node, registerCanvas }: any) => (
  <div className="flex flex-col gap-2">
    <canvas
      width={194}
      height={64}
      className="bg-slate-900 rounded border border-slate-700"
      ref={(el) => registerCanvas(node.id, el)}
    />
    <div className="text-[10px] text-slate-500 text-center">Frequency Spectrum</div>
  </div>
);

const WorkletControls = ({ node, editingCode, setEditingCode, onCompile }: any) => (
  <div className="flex flex-col gap-2">
    <div className="text-[10px] text-slate-400 flex items-center gap-1"><Code size={10} /> Custom Processor (JS)</div>
    <textarea className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono text-slate-300 resize-none focus:outline-none focus:border-pink-500"
      value={editingCode[node.id] || node.code || ''} onChange={(e) => setEditingCode((prev: any) => ({ ...prev, [node.id]: e.target.value }))} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
    <button onClick={() => onCompile(node.id)} className="flex items-center justify-center gap-2 w-full py-1 bg-pink-600 hover:bg-pink-500 text-white rounded text-xs font-semibold transition-colors"><Save size={12} /> Compile</button>
  </div>
);

// --- Main App ---
export default function AudioGraph() {
  const [engine] = useState(() => new AudioEngine());
  const [isEngineStarted, setIsEngineStarted] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const analyserCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const animationFrameRef = useRef<number>();

  const [editingCode, setEditingCode] = useState<{ [id: string]: string }>({});

  // 1. Mutable Source of Truth
  const nodesRef = useRef<BaseNode[]>([new DestinationNodeData('dest', 800, 300)]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // 2. Force Update Trigger
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawingWire, setDrawingWire] = useState<{ startNodeId: string, currentX: number, currentY: number } | null>(null);

  // Visualization Loop
  const drawVisualizers = () => {
    if (!isEngineStarted) return;
    nodesRef.current.forEach(node => {
      if (node instanceof AnalyserNodeData) {
        const canvas = analyserCanvasRefs.current.get(node.id);
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const data = engine.getAnalyserData(node.id);
          if (ctx && data) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);
            const barWidth = (width / data.length) * 2.5;
            let barX = 0;
            for (let i = 0; i < data.length; i++) {
              const barHeight = (data[i] / 255) * height;
              ctx.fillStyle = `rgb(${barHeight + 50}, ${255 - barHeight}, 150)`;
              ctx.fillRect(barX, height - barHeight, barWidth, barHeight);
              barX += barWidth + 1;
              if (barX > width) break;
            }
          }
        }
      }
    });
    animationFrameRef.current = requestAnimationFrame(drawVisualizers);
  };

  useEffect(() => {
    if (isEngineStarted) {
      engine.createNode(nodesRef.current.find(n => n.id === 'dest')!);
      drawVisualizers();
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isEngineStarted]);

  const startEngine = () => {
    engine.init();
    setIsEngineStarted(true);
    nodesRef.current.forEach(n => engine.createNode(n));
    setTimeout(() => connections.forEach(c => engine.connect(c.from, c.to)), 100);
  };

  const addNode = (type: NodeType) => {
    const id = `node_${Date.now()}`;
    const x = 100 + Math.random() * 200;
    const y = 100 + Math.random() * 200;

    let newNode: BaseNode;
    switch (type) {
      case 'oscillator': newNode = new OscillatorNodeData(id, x, y); break;
      case 'gain': newNode = new GainNodeData(id, x, y); break;
      case 'delay': newNode = new DelayNodeData(id, x, y); break;
      case 'panner': newNode = new PannerNodeData(id, x, y); break;
      case 'analyser': newNode = new AnalyserNodeData(id, x, y); break;
      case 'worklet': newNode = new WorkletNodeData(id, x, y); setEditingCode(prev => ({ ...prev, [id]: DEFAULT_WORKLET_CODE })); break;
      default: return;
    }

    nodesRef.current.push(newNode);
    if (isEngineStarted) engine.createNode(newNode);
    forceUpdate();
  };

  const updateWorkletCode = async (id: string) => {
    const code = editingCode[id];
    const node = nodesRef.current.find(n => n.id === id);
    if (!(node instanceof WorkletNodeData) || !code) return;

    // Mutate
    node.code = code;
    node.codeVersion += 1;

    await engine.createNode(node);
    connections.filter(c => c.from === id || c.to === id).forEach(c => engine.connect(c.from, c.to));
    forceUpdate();
  };

  const removeNode = (id: string) => {
    if (id === 'dest') return;
    const relatedConnections = connections.filter(c => c.from === id || c.to === id);
    relatedConnections.forEach(c => engine.disconnect(c.from, c.to));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));

    // Mutate remove
    nodesRef.current = nodesRef.current.filter(n => n.id !== id);
    engine.removeNode(id);
    analyserCanvasRefs.current.delete(id);
    forceUpdate();
  };

  const updateParam = (id: string, params: Record<string, any>) => {
    const node = nodesRef.current.find(n => n.id === id);
    if (node) {
      // Direct mutation merging
      Object.assign(node, params);
      engine.updateParam(node, params);
      forceUpdate();
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodesRef.current.find(n => n.id === id);
    if (!node) return;
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    setDraggingNodeId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const node = nodesRef.current.find(n => n.id === draggingNodeId);
      if (node) {
        node.setPosition(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
        forceUpdate();
      }
    }
    if (drawingWire && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDrawingWire(prev => prev ? { ...prev, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top } : null);
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setDrawingWire(null);
  };

  const startWire = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDrawingWire({ startNodeId: nodeId, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top });
  };

  const endWire = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (!drawingWire || drawingWire.startNodeId === targetNodeId) return;
    const newConn = { id: `${drawingWire.startNodeId}-${targetNodeId}`, from: drawingWire.startNodeId, to: targetNodeId };
    if (!connections.find(c => c.from === newConn.from && c.to === newConn.to)) {
      setConnections(prev => [...prev, newConn]);
      engine.connect(newConn.from, newConn.to);
    }
    setDrawingWire(null);
  };

  const removeConnection = (conn: Connection) => {
    engine.disconnect(conn.from, conn.to);
    setConnections(prev => prev.filter(c => c.id !== conn.id));
  };

  const getPortPos = (nodeId: string, isInput: boolean) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const width = node instanceof WorkletNodeData ? NODE_WIDTH_LARGE : NODE_WIDTH;
    return { x: isInput ? node.x : node.x + width, y: node.y + HEADER_HEIGHT / 2 };
  };

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col font-sans" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between z-50 shadow-lg">
        <div className="flex items-center gap-2"><div className="bg-indigo-600 p-2 rounded-lg"><Activity className="w-6 h-6 text-white" /></div><h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">WebAudio Graph</h1></div>
        <div className="flex items-center gap-4">
          {!isEngineStarted && <button onClick={startEngine} className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all animate-pulse"><Play size={18} /> Start Engine</button>}
          <div className="h-8 w-px bg-slate-700 mx-2" />
          <button onClick={() => addNode('oscillator')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors text-sm"><Activity size={16} className="text-emerald-400" /> Osc</button>
          <button onClick={() => addNode('gain')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors text-sm"><Volume2 size={16} className="text-amber-400" /> Gain</button>
          <button onClick={() => addNode('delay')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors text-sm"><Sliders size={16} className="text-purple-400" /> Delay</button>
          <button onClick={() => addNode('panner')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors text-sm"><Globe size={16} className="text-cyan-400" /> Spatial</button>
          <button onClick={() => addNode('analyser')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors text-sm"><BarChart3 size={16} className="text-orange-400" /> Analyser</button>
          <button onClick={() => addNode('worklet')} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors text-sm"><Cpu size={16} className="text-pink-400" /> Worklet</button>
        </div>
      </div>

      <div ref={canvasRef} className="flex-1 relative cursor-crosshair bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {!isEngineStarted && <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center"><div className="text-center"><h2 className="text-3xl font-bold text-white mb-4">Click "Start Engine"</h2></div></div>}

        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
          {connections.map(conn => {
            const start = getPortPos(conn.from, false); const end = getPortPos(conn.to, true);
            const path = `M ${start.x} ${start.y} C ${start.x + 80} ${start.y}, ${end.x - 80} ${end.y}, ${end.x} ${end.y}`;
            return <g key={conn.id} className="pointer-events-auto cursor-pointer group" onDoubleClick={() => removeConnection(conn)}><path d={path} stroke="transparent" strokeWidth="15" fill="none" /><path d={path} stroke="#64748b" strokeWidth="3" fill="none" className="group-hover:stroke-red-500 transition-colors" /></g>;
          })}
          {drawingWire && <path d={`M ${getPortPos(drawingWire.startNodeId, false).x} ${getPortPos(drawingWire.startNodeId, false).y} C ${getPortPos(drawingWire.startNodeId, false).x + 50} ${getPortPos(drawingWire.startNodeId, false).y}, ${drawingWire.currentX - 50} ${drawingWire.currentY}, ${drawingWire.currentX} ${drawingWire.currentY}`} stroke="#3b82f6" strokeWidth="3" fill="none" strokeDasharray="5,5" />}
        </svg>

        {nodesRef.current.map(node => (
          <NodeShell key={node.id} node={node} onDelete={removeNode} onStartWire={startWire} onEndWire={endWire} onMouseDown={handleMouseDown}>
            {node instanceof OscillatorNodeData && <OscillatorControls node={node} onUpdate={updateParam} />}
            {node instanceof GainNodeData && <GainControls node={node} onUpdate={updateParam} />}
            {node instanceof DelayNodeData && <DelayControls node={node} onUpdate={updateParam} />}
            {node instanceof PannerNodeData && <PannerControls node={node} onUpdate={updateParam} />}
            {node instanceof AnalyserNodeData && <AnalyserControls node={node} registerCanvas={(id: any, el: any) => el ? analyserCanvasRefs.current.set(id, el) : analyserCanvasRefs.current.delete(id)} />}
            {node instanceof WorkletNodeData && <WorkletControls node={node} editingCode={editingCode} setEditingCode={setEditingCode} onCompile={updateWorkletCode} />}
            {node instanceof DestinationNodeData && <div className="text-slate-500 italic text-center py-2">Main Output</div>}
          </NodeShell>
        ))}
      </div>
    </div>
  );
}