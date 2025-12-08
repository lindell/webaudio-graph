import { BaseNode } from '../BaseNode';

export class PannerNodeData extends BaseNode {
    readonly type = 'panner';
    static readonly type = 'panner';
    readonly label = 'Spatial Pan';

    constructor(
        id: string, x: number, y: number,
        public positionX: number = 0,
        public positionY: number = 0,
        public positionZ: number = 0,
        public panningModel: PanningModelType = 'HRTF'
    ) { super(id, x, y); }

    static fromJSON(data: any): PannerNodeData {
        return new PannerNodeData(data.id, data.x, data.y, data.positionX, data.positionY, data.positionZ, data.panningModel);
    }

    createAudioNode(ctx: AudioContext): AudioNode {
        const p = ctx.createPanner();
        p.panningModel = this.panningModel;
        p.distanceModel = 'inverse';
        p.positionX.value = this.positionX;
        p.positionY.value = this.positionY;
        p.positionZ.value = this.positionZ;
        return p;
    }

    updateAudioParam(ctx: AudioContext, node: AudioNode, params: Partial<PannerNodeData>) {
        const p = node as PannerNode;
        if (params.positionX !== undefined) p.positionX.setTargetAtTime(params.positionX, ctx.currentTime, 0.02);
        if (params.positionY !== undefined) p.positionY.setTargetAtTime(params.positionY, ctx.currentTime, 0.02);
        if (params.positionZ !== undefined) p.positionZ.setTargetAtTime(params.positionZ, ctx.currentTime, 0.02);
        if (params.panningModel !== undefined) p.panningModel = params.panningModel;
    }
}
