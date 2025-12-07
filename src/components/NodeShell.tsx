import React from 'react';
import { Activity, Volume2, Sliders, Globe, BarChart3, Cpu, Speaker, Trash2 } from 'lucide-react';
import { BaseNode } from '../nodes/BaseNode';

const NODE_WIDTH = 220;
const NODE_WIDTH_LARGE = 320;

interface NodeShellProps {
    node: BaseNode;
    children: React.ReactNode;
    onDelete: (id: string) => void;
    onStartWire: (e: React.MouseEvent, id: string) => void;
    onEndWire: (e: React.MouseEvent, id: string) => void;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
}

export const NodeShell: React.FC<NodeShellProps> = ({ node, children, onDelete, onStartWire, onEndWire, onMouseDown }) => {
    const width = node.type === 'worklet' ? NODE_WIDTH_LARGE : NODE_WIDTH;
    let colorClass = 'border-slate-500', titleClass = 'bg-slate-600', Icon = Activity;

    switch (node.type) {
        case 'oscillator': colorClass = 'border-emerald-500 shadow-emerald-900/20'; titleClass = 'bg-emerald-600'; Icon = Activity; break;
        case 'gain': colorClass = 'border-amber-500 shadow-amber-900/20'; titleClass = 'bg-amber-600'; Icon = Volume2; break;
        case 'delay': colorClass = 'border-purple-500 shadow-purple-900/20'; titleClass = 'bg-purple-600'; Icon = Sliders; break;
        case 'panner': colorClass = 'border-cyan-500 shadow-cyan-900/20'; titleClass = 'bg-cyan-600'; Icon = Globe; break;
        case 'analyser': colorClass = 'border-orange-500 shadow-orange-900/20'; titleClass = 'bg-orange-600'; Icon = BarChart3; break;
        case 'worklet': colorClass = 'border-pink-500 shadow-pink-900/20'; titleClass = 'bg-pink-600'; Icon = Cpu; break;
        case 'destination': colorClass = 'border-rose-500 shadow-rose-900/20'; titleClass = 'bg-rose-600'; Icon = Speaker; break;
    }

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
