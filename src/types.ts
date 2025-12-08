export type NodeType = 'oscillator' | 'gain' | 'delay' | 'panner' | 'analyser' | 'worklet' | 'media' | 'destination';

export interface Connection {
    id: string;
    from: string;
    to: string;
}

export interface IAudioEngine {
    getNode(id: string): AudioNode | undefined;
}
