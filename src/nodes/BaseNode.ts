import { NodeType, IAudioEngine } from '../types';

export abstract class BaseNode {
    constructor(public id: string, public x: number, public y: number) { }

    abstract get type(): NodeType;
    abstract get label(): string;

    abstract createAudioNode(ctx: AudioContext, engine: IAudioEngine): AudioNode | Promise<AudioNode> | null;
    abstract updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<this>): void;

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}
