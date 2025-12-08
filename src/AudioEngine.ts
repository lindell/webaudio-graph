import { BaseNode } from './nodes/BaseNode';
import { IAudioEngine } from './types';

export class AudioEngine implements IAudioEngine {
    ctx: AudioContext | null = null;
    nodes: Map<string, AudioNode> = new Map();

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    async createNode(data: BaseNode) {
        if (!this.ctx) return;
        // We need to check if it's a worklet to allow re-creation/updating code
        // But BaseNode doesn't know about 'worklet' specific logic easily without casting or checking type string.
        // The original code checked: if (this.nodes.has(data.id) && data.type !== 'worklet') return;

        if (this.nodes.has(data.id) && data.type !== 'worklet') return;

        let audioNode: AudioNode | null = null;

        // We handle worklet specifically because it's async and complex
        if (data.type === 'worklet') {
            // We can't easily call createAudioNode if it returns a Promise without awaiting.
            // BaseNode signature says: AudioNode | Promise<AudioNode> | null
            try {
                const result = await data.createAudioNode(this.ctx, this);
                if (result instanceof AudioNode) {
                    audioNode = result;
                    const oldNode = this.nodes.get(data.id);
                    if (oldNode) oldNode.disconnect();
                }
            } catch (e) { return; }
        } else {
            const result = data.createAudioNode(this.ctx, this);
            if (result instanceof AudioNode) audioNode = result;
        }

        if (audioNode) this.nodes.set(data.id, audioNode);
    }

    updateParam(data: BaseNode, params: any) {
        if (!this.ctx) return;
        const audioNode = this.nodes.get(data.id);
        if (audioNode) data.updateAudioParam(this.ctx, audioNode, params);
    }

    getNode(id: string): AudioNode | undefined {
        return this.nodes.get(id);
    }

    connect(fromId: string, toId: string) {
        const src = this.nodes.get(fromId);
        const dst = this.nodes.get(toId);
        if (src && dst) { try { src.connect(dst); } catch (e) { } }
    }

    disconnect(fromId: string, toId: string) {
        const src = this.nodes.get(fromId);
        const dst = this.nodes.get(toId);
        if (src && dst) { try { src.disconnect(dst); } catch (e) { } }
    }

    removeNode(id: string) {
        const node = this.nodes.get(id);
        if (node) {
            node.disconnect();
            if (node instanceof OscillatorNode) try { node.stop(); } catch (e) { }
            this.nodes.delete(id);
        }
    }
}
