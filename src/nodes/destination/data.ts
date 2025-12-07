import { BaseNode } from '../BaseNode';

export class DestinationNodeData extends BaseNode {
    readonly type = 'destination';
    readonly label = 'Speakers';
    constructor(id: string, x: number, y: number) { super(id, x, y); }
    createAudioNode(ctx: AudioContext): AudioNode { return ctx.destination; }
    updateAudioParam() { }
}
