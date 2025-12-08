import { OscillatorNodeData } from './oscillator/data';
import { GainNodeData } from './gain/data';
import { DelayNodeData } from './delay/data';
import { PannerNodeData } from './panner/data';
import { AnalyserNodeData } from './analyser/data';
import { WorkletNodeData } from './worklet/data';
import { DestinationNodeData } from './destination/data';

import { MediaNodeData } from './media/data';

export const NODE_REGISTRY: Record<string, any> = {
    'oscillator': OscillatorNodeData,
    'gain': GainNodeData,
    'delay': DelayNodeData,
    'panner': PannerNodeData,
    'analyser': AnalyserNodeData,
    'worklet': WorkletNodeData,
    'media': MediaNodeData,
    'destination': DestinationNodeData
};

export type NodeType = keyof typeof NODE_REGISTRY;
