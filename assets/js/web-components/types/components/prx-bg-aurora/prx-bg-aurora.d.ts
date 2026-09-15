import { Renderer, Program, Mesh } from 'ogl';
export declare class PrxBgAurora {
    animateId: number;
    renderer: Renderer;
    program: Program;
    mesh: Mesh;
    el: HTMLElement;
    /**
     * An array of three hex colors defining the aurora gradient.
     */
    colorStops: string[];
    /**
     * Controls the height intensity of the aurora effect.
     */
    amplitude: number;
    /**
     * Controls the blending of the aurora effect with the background.
     */
    blend: number;
    /**
     * Controls the animation speed. Higher values make the aurora move faster.
     */
    speed: number;
    /**
     * Current time of animation. Use to externally control animation progress.
     */
    time: number;
    connectedCallback(): void;
    disconnectCallback(): void;
    resize: () => void;
    update: (t: number) => void;
    render(): any;
}
