import { BaseNode } from '../BaseNode';

export class MediaNodeData extends BaseNode {
    readonly type = 'media';
    static readonly type = 'media';
    readonly label = 'Media Player';

    public url: string = '/static/beat.mp3';
    public loop: boolean = true;

    // Transient
    public audioElement: HTMLAudioElement | null = null;
    public mediaSource: MediaElementAudioSourceNode | null = null;

    constructor(id: string, x: number, y: number, url?: string, loop?: boolean) {
        super(id, x, y);
        if (url) this.url = url;
        if (loop !== undefined) this.loop = loop;
    }

    static fromJSON(data: any): MediaNodeData {
        return new MediaNodeData(data.id, data.x, data.y, data.url, data.loop);
    }

    createAudioNode(ctx: AudioContext): AudioNode {
        if (!this.audioElement) {
            this.audioElement = new Audio(this.url);
            this.audioElement.crossOrigin = 'anonymous';
            this.audioElement.loop = this.loop;
        }

        if (!this.mediaSource) {
            this.mediaSource = ctx.createMediaElementSource(this.audioElement);
        }

        return this.mediaSource;
    }

    play() {
        if (this.audioElement) {
            // Resume context if suspended (browser policy)
            if (this.mediaSource && this.mediaSource.context.state === 'suspended') {
                (this.mediaSource.context as AudioContext).resume();
            }
            this.audioElement.play().catch(e => console.error("Play failed", e));
        }
    }

    pause() {
        if (this.audioElement) this.audioElement.pause();
    }

    setLoop(loop: boolean) {
        this.loop = loop;
        if (this.audioElement) this.audioElement.loop = loop;
    }

    setUrl(url: string) {
        this.url = url;
        if (this.audioElement) {
            const wasPlaying = !this.audioElement.paused;
            this.audioElement.src = url;
            if (wasPlaying) {
                this.audioElement.play().catch(e => console.error("Resume failed after URL change", e));
            }
        }
    }

    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            type: this.type,
            url: this.url,
            loop: this.loop
        };
    }

    updateAudioParam() { }
}
