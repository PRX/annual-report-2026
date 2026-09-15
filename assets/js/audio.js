((doc, win) => {
  let allAudio = [];

  win.prx = win.prx || {};

  win.prx.pausePlayingAudio = (ignoredAudioEl) => {
    allAudio.forEach((audio) => {
      if (!audio.paused && (ignoredAudioEl && audio !== ignoredAudioEl)) audio.pause();
    });
  };

  // Need to delay looking up audio elements to give prx-audio-quote components a chance to render.
  setTimeout(() => {
    allAudio = doc.querySelectorAll('audio');

    allAudio.forEach((audioEl) => {
      audioEl.addEventListener('play', (e) => {
        // Pause all other audio.
        win.prx.pausePlayingAudio(e.target);
      })
    })
  }, 1000);
})(document, window);
