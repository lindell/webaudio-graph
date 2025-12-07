import React from 'react';
import { GainNodeData } from './data';

export const GainControls = ({ node, onUpdate }: { node: GainNodeData, onUpdate: (id: string, params: any) => void }) => (
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
