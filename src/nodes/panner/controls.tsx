import { PannerNodeData } from './data';

export const PannerControls = ({ node, onUpdate }: { node: PannerNodeData, onUpdate: (id: string, params: any) => void }) => (
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
