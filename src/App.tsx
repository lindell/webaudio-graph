import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Activity, Volume2, Sliders, Globe, BarChart3, Cpu } from 'lucide-react';

import { NodeType, Connection } from './types';
import { AudioEngine } from './AudioEngine';
import { BaseNode } from './nodes/BaseNode';
import { NodeShell } from './components/NodeShell';

import { OscillatorNodeData } from './nodes/oscillator/data';
import { OscillatorControls } from './nodes/oscillator/controls';
import { GainNodeData } from './nodes/gain/data';
import { GainControls } from './nodes/gain/controls';
import { DelayNodeData } from './nodes/delay/data';
import { DelayControls } from './nodes/delay/controls';
import { PannerNodeData } from './nodes/panner/data';
import { PannerControls } from './nodes/panner/controls';
import { AnalyserNodeData } from './nodes/analyser/data';
import { AnalyserControls } from './nodes/analyser/controls';
import { WorkletNodeData, DEFAULT_WORKLET_CODE } from './nodes/worklet/data';
import { WorkletControls } from './nodes/worklet/controls';
import { DestinationNodeData } from './nodes/destination/data';
import { DestinationControls } from './nodes/destination/controls';

const HEADER_HEIGHT = 40;
const NODE_WIDTH = 220;
const NODE_WIDTH_LARGE = 320;

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
      // Find destination node to start graph
      const destNode = nodesRef.current.find(n => n.type === 'destination');
      if (destNode) engine.createNode(destNode);
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
    if (id === 'dest') return; // Should check if it's the main destination node more robustly if needed, but 'dest' ID is hardcoded for initial one.
    // Actually, checking type is safer if ID changes, but here we check ID 'dest'.
    const nodeToRemove = nodesRef.current.find(n => n.id === id);
    if (nodeToRemove instanceof DestinationNodeData) return;

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
            {node instanceof DestinationNodeData && <DestinationControls />}
          </NodeShell>
        ))}
      </div>
    </div>
  );
}