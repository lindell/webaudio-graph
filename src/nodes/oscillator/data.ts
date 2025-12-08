import { BaseNode } from '../BaseNode';

export class OscillatorNodeData extends BaseNode {
    readonly type = 'oscillator';
    static readonly type = 'oscillator';
    readonly label = 'Oscillator';

    constructor(
        id: string, x: number, y: number,
        public frequency: number = 440,
        public waveType: OscillatorType = 'sine'
    ) { super(id, x, y); }

    static fromJSON(data: any): OscillatorNodeData {
        return new OscillatorNodeData(data.id, data.x, data.y, data.frequency, data.waveType);
    }

    createAudioNode(ctx: AudioContext): AudioNode {
        const osc = ctx.createOscillator();
        osc.type = this.waveType;
        osc.frequency.value = this.frequency;
        osc.start();
        return osc;
    }

    updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<OscillatorNodeData>) {
        const osc = node as OscillatorNode;
        if (params.frequency !== undefined) osc.frequency.setTargetAtTime(params.frequency, ctx.currentTime, 0.02);
        if (params.waveType !== undefined) osc.type = params.waveType;
    }
}
