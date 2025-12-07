export type NodeType = 'oscillator' | 'gain' | 'delay' | 'panner' | 'analyser' | 'worklet' | 'destination';

export interface Connection {
    id: string;
    from: string;
    to: string;
}

export interface IAudioEngine {
    analyserBuffers: Map<string, Uint8Array>;
}
