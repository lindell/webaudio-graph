import { AnalyserNodeData } from './data';

export const AnalyserControls = ({ node, registerCanvas }: { node: AnalyserNodeData, registerCanvas: (id: string, el: HTMLCanvasElement | null) => void }) => (
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
