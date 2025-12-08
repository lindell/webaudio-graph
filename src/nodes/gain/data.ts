import { BaseNode } from '../BaseNode';

export class GainNodeData extends BaseNode {
    readonly type = 'gain';
    readonly label = 'Gain';

    constructor(id: string, x: number, y: number, public gain: number = 0.5) { super(id, x, y); }

    static fromJSON(data: any): GainNodeData {
        return new GainNodeData(data.id, data.x, data.y, data.gain);
    }

    createAudioNode(ctx: AudioContext): AudioNode {
        const g = ctx.createGain();
        g.gain.value = this.gain;
        return g;
    }

    updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<GainNodeData>) {
        const g = node as GainNode;
        if (params.gain !== undefined) g.gain.setTargetAtTime(params.gain, ctx.currentTime, 0.02);
    }
}
