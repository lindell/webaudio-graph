import { BaseNode } from '../BaseNode';

export class DestinationNodeData extends BaseNode {
    readonly type = 'destination';
    static readonly type = 'destination';
    readonly label = 'Speakers';
    constructor(id: string, x: number, y: number) { super(id, x, y); }

    static fromJSON(data: any): DestinationNodeData {
        return new DestinationNodeData(data.id, data.x, data.y);
    }

    createAudioNode(ctx: AudioContext): AudioNode { return ctx.destination; }
    updateAudioParam() { }
}
