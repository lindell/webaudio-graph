import React from 'react';
import { Save, Code } from 'lucide-react';
import { WorkletNodeData } from './data';

export const WorkletControls = ({ node, editingCode, setEditingCode, onCompile }: { node: WorkletNodeData, editingCode: { [id: string]: string }, setEditingCode: React.Dispatch<React.SetStateAction<{ [id: string]: string }>>, onCompile: (id: string) => void }) => (
    <div className="flex flex-col gap-2">
        <div className="text-[10px] text-slate-400 flex items-center gap-1"><Code size={10} /> Custom Processor (JS)</div>
        <textarea className="w-full h-32 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono text-slate-300 resize-none focus:outline-none focus:border-pink-500"
            value={editingCode[node.id] || node.code || ''} onChange={(e) => setEditingCode((prev: any) => ({ ...prev, [node.id]: e.target.value }))} onKeyDown={(e) => e.stopPropagation()} spellCheck={false} />
        <button onClick={() => onCompile(node.id)} className="flex items-center justify-center gap-2 w-full py-1 bg-pink-600 hover:bg-pink-500 text-white rounded text-xs font-semibold transition-colors"><Save size={12} /> Compile</button>
    </div>
);
