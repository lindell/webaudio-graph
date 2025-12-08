import { BaseNode } from '../BaseNode';

export class DelayNodeData extends BaseNode {
    readonly type = 'delay';
    static readonly type = 'delay';
    readonly label = 'Delay';

    constructor(id: string, x: number, y: number, public delayTime: number = 0.3) { super(id, x, y); }

    static fromJSON(data: any): DelayNodeData {
        return new DelayNodeData(data.id, data.x, data.y, data.delayTime);
    }

    createAudioNode(ctx: AudioContext): AudioNode {
        const d = ctx.createDelay(5.0);
        d.delayTime.value = this.delayTime;
        return d;
    }

    updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<DelayNodeData>) {
        const d = node as DelayNode;
        if (params.delayTime !== undefined) d.delayTime.setTargetAtTime(params.delayTime, ctx.currentTime, 0.02);
    }
}
