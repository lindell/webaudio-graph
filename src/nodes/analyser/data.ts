import { BaseNode } from '../BaseNode';
import { IAudioEngine } from '../../types';

export class AnalyserNodeData extends BaseNode {
    readonly type = 'analyser';
    readonly label = 'Analyser';

    constructor(id: string, x: number, y: number) { super(id, x, y); }

    static fromJSON(data: any): AnalyserNodeData {
        return new AnalyserNodeData(data.id, data.x, data.y);
    }

    createAudioNode(ctx: AudioContext, engine: IAudioEngine): AudioNode {
        const a = ctx.createAnalyser();
        a.fftSize = 2048;
        engine.analyserBuffers.set(this.id, new Uint8Array(a.frequencyBinCount));
        return a;
    }

    updateAudioParam() { }
}
