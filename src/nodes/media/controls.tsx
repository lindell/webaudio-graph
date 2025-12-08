import React, { useState, useEffect } from 'react';
import { Play, Pause, Repeat, Music } from 'lucide-react';
import { MediaNodeData } from './data';

const PRESETS = [
    { label: 'Beat', url: '/static/beat.mp3' },
    { label: 'Bass', url: '/static/bass.mp3' },
    { label: 'Custom', url: '' }
];

export const MediaControls = ({ node, onUpdate }: { node: MediaNodeData, onUpdate: (id: string, data: any) => void }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(() => {
        const found = PRESETS.find(p => p.url === node.url);
        return found ? found.label : 'Custom';
    });
    const [customUrl, setCustomUrl] = useState(node.url);

    // Sync playing state with audio element events
    useEffect(() => {
        const el = node.audioElement;
        if (!el) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEmptied = () => setIsPlaying(false);
        const onPlaying = () => setIsPlaying(true);

        el.addEventListener('play', onPlay);
        el.addEventListener('pause', onPause);
        el.addEventListener('emptied', onEmptied);
        el.addEventListener('playing', onPlaying);

        // Check initial state
        if (!el.paused) setIsPlaying(true);

        return () => {
            el.removeEventListener('play', onPlay);
            el.removeEventListener('pause', onPause);
            el.removeEventListener('emptied', onEmptied);
            el.removeEventListener('playing', onPlaying);
        };
    }, [node.audioElement]);

    const togglePlay = () => {
        if (isPlaying) node.pause();
        else node.play();
    };

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const label = e.target.value;
        setSelectedPreset(label);

        if (label !== 'Custom') {
            const preset = PRESETS.find(p => p.label === label);
            if (preset) {
                node.setUrl(preset.url);
                setCustomUrl(preset.url);
                onUpdate(node.id, { url: preset.url });
            }
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setCustomUrl(url);
        node.setUrl(url);
        onUpdate(node.id, { url });
    };

    const toggleLoop = () => {
        const newLoop = !node.loop;
        node.setLoop(newLoop);
        onUpdate(node.id, { loop: newLoop });
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="text-[10px] text-slate-400 flex items-center gap-1"><Music size={10} /> Audio Source</div>

            <select
                className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-300 focus:outline-none focus:border-pink-500"
                value={selectedPreset}
                onChange={handlePresetChange}
                onMouseDown={e => e.stopPropagation()}
            >
                {PRESETS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
            </select>

            {selectedPreset === 'Custom' && (
                <input
                    type="text"
                    className="bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-300 focus:outline-none focus:border-pink-500"
                    value={customUrl}
                    onChange={handleUrlChange}
                    placeholder="https://..."
                    onMouseDown={e => e.stopPropagation()}
                />
            )}

            <div className="flex gap-2">
                <button
                    onClick={togglePlay}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs font-semibold transition-colors ${isPlaying ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                    {isPlaying ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Play</>}
                </button>

                <button
                    onClick={toggleLoop}
                    className={`px-2 rounded border transition-colors ${node.loop ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'}`}
                    title="Toggle Loop"
                >
                    <Repeat size={12} />
                </button>
            </div>
        </div>
    );
};
