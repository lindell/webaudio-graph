import { BaseNode } from '../BaseNode';
import { IAudioEngine } from '../../types';

export class AnalyserNodeData extends BaseNode {
    readonly type = 'analyser';
    static readonly type = 'analyser';
    readonly label = 'Analyser';

    constructor(id: string, x: number, y: number) { super(id, x, y); }

    public buffer: Uint8Array | null = null;

    static fromJSON(data: any): AnalyserNodeData {
        return new AnalyserNodeData(data.id, data.x, data.y);
    }

    createAudioNode(ctx: AudioContext): AudioNode {
        const a = ctx.createAnalyser();
        a.fftSize = 2048;
        this.buffer = new Uint8Array(a.frequencyBinCount);
        return a;
    }

    draw(canvas: HTMLCanvasElement, engine: IAudioEngine) {
        const node = engine.getNode(this.id);
        if (node instanceof AnalyserNode && this.buffer) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            node.getByteFrequencyData(this.buffer as any);
            const data = this.buffer;

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

    updateAudioParam() { }
}
