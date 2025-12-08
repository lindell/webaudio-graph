import { BaseNode } from './nodes/BaseNode';
import { Connection } from './types';
import { OscillatorNodeData } from './nodes/oscillator/data';
import { GainNodeData } from './nodes/gain/data';
import { DelayNodeData } from './nodes/delay/data';
import { PannerNodeData } from './nodes/panner/data';
import { AnalyserNodeData } from './nodes/analyser/data';
import { WorkletNodeData } from './nodes/worklet/data';
import { DestinationNodeData } from './nodes/destination/data';

interface SerializedGraph {
    nodes: any[];
    connections: Connection[];
}

export const serialize = (nodes: BaseNode[], connections: Connection[]): string => {
    return JSON.stringify({ nodes, connections }, null, 2);
};

export const deserialize = (json: string): { nodes: BaseNode[], connections: Connection[] } => {
    const data: SerializedGraph = JSON.parse(json);

    const nodes = data.nodes.map((n: any) => {
        switch (n.type) {
            case 'oscillator': return OscillatorNodeData.fromJSON(n);
            case 'gain': return GainNodeData.fromJSON(n);
            case 'delay': return DelayNodeData.fromJSON(n);
            case 'panner': return PannerNodeData.fromJSON(n);
            case 'analyser': return AnalyserNodeData.fromJSON(n);
            case 'worklet': return WorkletNodeData.fromJSON(n);
            case 'destination': return DestinationNodeData.fromJSON(n);
            default:
                throw new Error(`Unknown node type: ${n.type}`);
        }
    });

    return { nodes, connections: data.connections };
};
