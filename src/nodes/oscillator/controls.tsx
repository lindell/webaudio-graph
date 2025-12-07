import React from 'react';
import { OscillatorNodeData } from './data';

export const OscillatorControls = ({ node, onUpdate }: { node: OscillatorNodeData, onUpdate: (id: string, params: any) => void }) => (
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
