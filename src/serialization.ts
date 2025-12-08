import { BaseNode } from './nodes/BaseNode';
import { Connection } from './types';
import { NODE_REGISTRY } from './nodes/registry';

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
        const NodeClass = NODE_REGISTRY[n.type as keyof typeof NODE_REGISTRY];
        if (!NodeClass) {
            throw new Error(`Unknown node type: ${n.type}`);
        }
        return NodeClass.fromJSON(n);
    });

    return { nodes, connections: data.connections };
};
