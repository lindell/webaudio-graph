import { useRef, useEffect } from 'react';
import { AnalyserNodeData } from './data';
import { BarChart3 } from 'lucide-react';

export const AnalyserControls = ({ node }: { node: AnalyserNodeData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bufferRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        let animationFrameId: number;

        const draw = () => {
            const canvas = canvasRef.current;
            if (canvas && node.audioNode) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    if (!bufferRef.current || bufferRef.current.length !== node.audioNode.frequencyBinCount) {
                        bufferRef.current = new Uint8Array(node.audioNode.frequencyBinCount);
                    }

                    node.audioNode.getByteFrequencyData(bufferRef.current as any);
                    const data = bufferRef.current;
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
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrameId);
    }, [node]);

    return (
        <div className="flex flex-col gap-2">
            <div className="text-[10px] text-slate-400 flex items-center gap-1"><BarChart3 size={10} /> Frequency</div>
            <canvas ref={canvasRef} width={200} height={100} className="w-full bg-slate-900 rounded border border-slate-700" />
        </div>
    );
};
