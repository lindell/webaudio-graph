import { BaseNode } from '../BaseNode';

export class AnalyserNodeData extends BaseNode {
    readonly type = 'analyser';
    static readonly type = 'analyser';
    readonly label = 'Analyser';

    constructor(id: string, x: number, y: number) { super(id, x, y); }

    public audioNode: AnalyserNode | null = null;

    static fromJSON(data: any): AnalyserNodeData {
        return new AnalyserNodeData(data.id, data.x, data.y);
    }

    createAudioNode(ctx: AudioContext): AudioNode {
        const a = ctx.createAnalyser();
        a.fftSize = 2048;
        this.audioNode = a;
        return a;
    }

    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            type: this.type
        };
    }

    updateAudioParam() { }
}
