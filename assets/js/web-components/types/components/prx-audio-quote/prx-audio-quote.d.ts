export declare class PrxAudioQuote {
    el: HTMLElement;
    src: string;
    transcriptUrl: string;
    playing: boolean;
    progress: number;
    private audioEl;
    private trackEl;
    private wordSpans;
    private currentWordIndex;
    private wrapWordsInSpans;
    private prepareWordForCompare;
    private reset;
    private handleCueChange;
    private handlePlayToggleClick;
    private handleRestartClick;
    connectedCallback(): void;
    disconnectCallback(): void;
    render(): any;
}
