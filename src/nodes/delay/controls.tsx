import React from 'react';
import { DelayNodeData } from './data';

export const DelayControls = ({ node, onUpdate }: { node: DelayNodeData, onUpdate: (id: string, params: any) => void }) => (
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
