import { OscillatorNodeData } from './oscillator/data';
import { GainNodeData } from './gain/data';
import { DelayNodeData } from './delay/data';
import { PannerNodeData } from './panner/data';
import { AnalyserNodeData } from './analyser/data';
import { WorkletNodeData } from './worklet/data';
import { DestinationNodeData } from './destination/data';

export const NODE_REGISTRY = {
    [OscillatorNodeData.type]: OscillatorNodeData,
    [GainNodeData.type]: GainNodeData,
    [DelayNodeData.type]: DelayNodeData,
    [PannerNodeData.type]: PannerNodeData,
    [AnalyserNodeData.type]: AnalyserNodeData,
    [WorkletNodeData.type]: WorkletNodeData,
    [DestinationNodeData.type]: DestinationNodeData,
};

export type NodeType = keyof typeof NODE_REGISTRY;
