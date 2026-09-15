// biome-ignore lint/correctness/noUnusedImports: `h` is required code hinting JSX.
import { Component, Element, Host, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'prx-audio-quote',
  styleUrl: 'prx-audio-quote.css',
  shadow: false,
  scoped: true
})
export class PrxAudioQuote {

  @Element() el: HTMLElement;

  @Prop() src: string;

  @Prop() transcriptUrl: string;

  @State() playing: boolean = false;

  @State() progress: number = 0;

  private audioEl: HTMLAudioElement;

  private trackEl: HTMLTrackElement;

  private wordSpans: HTMLSpanElement[] = [];

  private currentWordIndex: number = 0;

  private wrapWordsInSpans = (node: Node) => {
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
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // If the node is an Element Node, iterate through its children
      // Create a copy of childNodes to avoid issues when modifying the DOM during iteration
      const children = Array.from(node.childNodes);
      children.forEach(child => { this.wrapWordsInSpans(child) }); // Recursively call for each child
    }
  }

  private prepareWordForCompare = (word: string) => word.replaceAll(/[^\w]/g,'').toLowerCase();

  private reset = () => {
    this.audioEl.currentTime = 0;
    this.currentWordIndex = 0;
    this.wordSpans.forEach((span) => { span.classList.remove('heard', 'active') });
  }

  private handleCueChange = (e: Event) => {
    const cues = (e.target as HTMLTrackElement).track.activeCues;
    const cue = cues[0] as VTTCue;
    const { text, startTime } = cue || {};

    if (!text) return;

    const word = this.prepareWordForCompare(text);
    const activeSpan = this.el.querySelector('span.word.active');
    const currentWordIndex = this.currentWordIndex + this.wordSpans.slice(this.currentWordIndex)
      .findIndex((span) => {
        return this.prepareWordForCompare(span.textContent) === word;
      });

    if (currentWordIndex < 0 || currentWordIndex > this.currentWordIndex + 3) {
      console.log(`Transcript word out of sync with quote text. "${text}" @ ${startTime} seconds.`);
      console.log(`"${this.wordSpans.slice(0, this.currentWordIndex + 1).map((span) => span.textContent ).join(' ')} (${text})..."`);
      return;
    }

    const currentSpan = this.wordSpans.at(currentWordIndex);

    activeSpan?.classList.remove('active');
    this.wordSpans.forEach((span) => { span.classList.remove('heard'); });

    if (!this.playing) return;

    currentSpan.classList.add('active');
    this.wordSpans.slice(0, currentWordIndex).forEach((span) => { span.classList.add('heard'); });

    this.currentWordIndex = currentWordIndex;
  }

  private handlePlayToggleClick = () => {
    const { paused } = this.audioEl;

    if (paused) {
      this.audioEl.play();
    } else {
      this.audioEl.pause();
    }
  }

  private handleRestartClick = () => {
    this.reset();
  }

  connectedCallback() {
    const { el, src, transcriptUrl } = this;

    if (!src) return;

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
    this.audioEl.addEventListener('timeupdate', () =>{
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

    this.el.after( this.audioEl );
  }

  disconnectCallback() {
    this.audioEl = null;
    this.trackEl = null;
  }

  render() {
    const { playing, progress, src, transcriptUrl } = this;
    const hasAudio = !!src?.length;
    const hasTranscript = !!transcriptUrl?.length;

    return (
      <Host playing={playing} highlight={hasTranscript} style={{ '--prx-audio-quote--progress': `${progress}` }}>
        <blockquote>
          <prx-quote><slot></slot></prx-quote>
          <cite><slot name='citation'></slot></cite>
          {hasAudio && (
            <prx-audio-quote-controls>
              <button type="button" class="restart-button" onClick={this.handleRestartClick} aria-label="Restart"></button>
              <button type="button" class="play-button" onClick={this.handlePlayToggleClick} aria-label={playing ? 'Pause' : 'Play'}>
                <span class="play-icon"></span>
              </button>
            </prx-audio-quote-controls>
          )}
        </blockquote>
      </Host>
    );
  }
}
