import { BaseNode } from '../BaseNode';

export const DEFAULT_WORKLET_CODE = `process(inputs, outputs, parameters) {
  const output = outputs[0];
  // Simple White Noise Generator
  output.forEach(channel => {
    for (let i = 0; i < channel.length; i++) {
      channel[i] = (Math.random() * 2 - 1) * 0.2;
    }
  });
  return true;
}`;

export class WorkletNodeData extends BaseNode {
    readonly type = 'worklet';
    readonly label = 'Worklet';

    constructor(
        id: string, x: number, y: number,
        public code: string = DEFAULT_WORKLET_CODE,
        public codeVersion: number = 0
    ) { super(id, x, y); }

    async createAudioNode(ctx: AudioContext): Promise<AudioNode> {
        const processorName = `processor-${this.id}-${this.codeVersion}`;
        const blobContent = `
      class CustomProcessor extends AudioWorkletProcessor {
        ${this.code}
      }
      registerProcessor('${processorName}', CustomProcessor);
    `;

        const blob = new Blob([blobContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);

        try {
            await ctx.audioWorklet.addModule(url);
            const node = new AudioWorkletNode(ctx, processorName);
            node.onprocessorerror = (e) => console.error("Worklet Error", e);
            return node;
        } catch (e) {
            console.error("Failed to load worklet", e);
            throw e;
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    updateAudioParam() { }
}
