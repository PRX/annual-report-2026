// biome-ignore lint/correctness/noUnusedImports: `h` is required code hinting JSX.
import { Host, h } from "@stencil/core";
export class PrxAudioQuote {
    el;
    src;
    transcriptUrl;
    playing = false;
    progress = 0;
    audioEl;
    trackEl;
    wordSpans = [];
    currentWordIndex = 0;
    wrapWordsInSpans = (node) => {
        const self = this;
        // If the node is a Text Node
        if (node.nodeType === Node.TEXT_NODE) {
            const textContent = node.textContent.trim(); // Get and trim the text content
            if (textContent.length > 0) { // Only process if there's actual text
                const words = textContent.split(/\s+/); // Split text into words by whitespace
                // Create a DocumentFragment to efficiently build the new content
                const fragment = document.createDocumentFragment();
                words.forEach((word, index) => {
                    // Avoid creating spans for empty strings if multiple spaces were present.
                    if (word.length > 0) {
                        const span = document.createElement('span');
                        span.textContent = word;
                        span.classList.add('word');
                        // span.addEventListener('click', self.handleWordClick);
                        fragment.appendChild(span);
                        self.wordSpans.push(span);
                        // Add a space after each word except the last one
                        const nextSibling = node.nextSibling || node.parentNode.nextSibling;
                        if (index < words.length - 1 || nextSibling?.textContent.trim().length && !/^[,.;:]/.test(nextSibling.textContent.trim())) {
                            fragment.appendChild(document.createTextNode(' '));
                        }
                    }
                });
                // Replace the original text node with the new fragment
                node.parentNode.replaceChild(fragment, node);
            }
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            // If the node is an Element Node, iterate through its children
            // Create a copy of childNodes to avoid issues when modifying the DOM during iteration
            const children = Array.from(node.childNodes);
            children.forEach(child => { this.wrapWordsInSpans(child); }); // Recursively call for each child
        }
    };
    prepareWordForCompare = (word) => word.replaceAll(/[^\w]/g, '').toLowerCase();
    reset = () => {
        this.audioEl.currentTime = 0;
        this.currentWordIndex = 0;
        this.wordSpans.forEach((span) => { span.classList.remove('heard', 'active'); });
    };
    handleCueChange = (e) => {
        const cues = e.target.track.activeCues;
        const cue = cues[0];
        const { text, startTime } = cue || {};
        if (!text)
            return;
        const word = this.prepareWordForCompare(text);
        const activeSpan = this.el.querySelector('span.word.active');
        const currentWordIndex = this.currentWordIndex + this.wordSpans.slice(this.currentWordIndex)
            .findIndex((span) => {
            return this.prepareWordForCompare(span.textContent) === word;
        });
        if (currentWordIndex < 0 || currentWordIndex > this.currentWordIndex + 3) {
            console.log(`Transcript word out of sync with quote text. "${text}" @ ${startTime} seconds.`);
            console.log(`"${this.wordSpans.slice(0, this.currentWordIndex + 1).map((span) => span.textContent).join(' ')} (${text})..."`);
            return;
        }
        const currentSpan = this.wordSpans.at(currentWordIndex);
        activeSpan?.classList.remove('active');
        this.wordSpans.forEach((span) => { span.classList.remove('heard'); });
        if (!this.playing)
            return;
        currentSpan.classList.add('active');
        this.wordSpans.slice(0, currentWordIndex).forEach((span) => { span.classList.add('heard'); });
        this.currentWordIndex = currentWordIndex;
    };
    handlePlayToggleClick = () => {
        const { paused } = this.audioEl;
        if (paused) {
            this.audioEl.play();
        }
        else {
            this.audioEl.pause();
        }
    };
    handleRestartClick = () => {
        this.reset();
    };
    connectedCallback() {
        const { el, src, transcriptUrl } = this;
        if (!src)
            return;
        // Prepare text content for highlighting.
        const blockquote = el.querySelector('blockquote');
        if (transcriptUrl && !blockquote) {
            const citeElement = el.querySelector('[slot=citation]');
            // Temporarily remove citation element so it doesn't get words wrapped.
            citeElement?.remove();
            this.wrapWordsInSpans(el);
            // Restore citation element.
            el.appendChild(citeElement);
        }
        // Initialize audio element.
        this.audioEl = document.createElement('audio');
        this.audioEl.crossOrigin = "anonymous";
        this.audioEl.preload = "none";
        this.audioEl.src = src;
        this.audioEl.addEventListener('timeupdate', () => {
            const { currentTime, duration } = this.audioEl;
            this.progress = currentTime / duration;
        });
        this.audioEl.addEventListener('play', () => { this.playing = true; });
        this.audioEl.addEventListener('pause', () => {
            this.playing = false;
            // this.reset();
        });
        this.audioEl.addEventListener('ended', () => {
            this.reset();
        });
        // Initialize track element.
        if (this.transcriptUrl?.length) {
            this.trackEl = document.createElement('track');
            this.trackEl.default = true;
            this.trackEl.kind = 'captions';
            this.trackEl.src = transcriptUrl;
            this.trackEl.addEventListener('cuechange', this.handleCueChange);
            this.audioEl.appendChild(this.trackEl);
        }
        this.el.after(this.audioEl);
    }
    disconnectCallback() {
        this.audioEl = null;
        this.trackEl = null;
    }
    render() {
        const { playing, progress, src, transcriptUrl } = this;
        const hasAudio = !!src?.length;
        const hasTranscript = !!transcriptUrl?.length;
        return (h(Host, { key: 'b065f3b0764f7a44cf93403ff2b80231663fa654', playing: playing, highlight: hasTranscript, style: { '--prx-audio-quote--progress': `${progress}` } }, h("blockquote", { key: '349f56ab416ab9beb3300125ac9d61f36677576f' }, h("prx-quote", { key: '3ce9f506247972bfa707ff0a46d0e6bae4536741' }, h("slot", { key: '7cba54616b09900b8111d2547c9b6231d6e947c4' })), h("cite", { key: 'dba2f2eb540e48142fb857f0dabc446b75b98689' }, h("slot", { key: '9b65e7c2b657ee60067b28c0f73e9d90925c5f28', name: 'citation' })), hasAudio && (h("prx-audio-quote-controls", { key: '052671d87a126f91c595d661d17437cfd6594b76' }, h("button", { key: '23812e962d1411b4fb35e4e4caadc2fca7ff4651', type: "button", class: "restart-button", onClick: this.handleRestartClick, "aria-label": "Restart" }), h("button", { key: '67a238a2a81228f1baf423ee3ad65cfce003cb32', type: "button", class: "play-button", onClick: this.handlePlayToggleClick, "aria-label": playing ? 'Pause' : 'Play' }, h("span", { key: '51d4b2fe8b638e4de528e3d56188dbb6b1ffdc1b', class: "play-icon" })))))));
    }
    static get is() { return "prx-audio-quote"; }
    static get encapsulation() { return "scoped"; }
    static get originalStyleUrls() {
        return {
            "$": ["prx-audio-quote.css"]
        };
    }
    static get styleUrls() {
        return {
            "$": ["prx-audio-quote.css"]
        };
    }
    static get properties() {
        return {
            "src": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "src"
            },
            "transcriptUrl": {
                "type": "string",
                "mutable": false,
                "complexType": {
                    "original": "string",
                    "resolved": "string",
                    "references": {}
                },
                "required": false,
                "optional": false,
                "docs": {
                    "tags": [],
                    "text": ""
                },
                "getter": false,
                "setter": false,
                "reflect": false,
                "attribute": "transcript-url"
            }
        };
    }
    static get states() {
        return {
            "playing": {},
            "progress": {}
        };
    }
    static get elementRef() { return "el"; }
}
//# sourceMappingURL=prx-audio-quote.js.map
