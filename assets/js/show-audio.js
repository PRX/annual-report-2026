((doc, win) => {
  const allShowAudio = doc.querySelectorAll(':where(.show-audio, .welcome-audio)');

  allShowAudio.forEach((wrapper) => {
    const audio = wrapper.querySelector('audio');
    const button = wrapper.querySelector('button');
    const progressSliderInput = wrapper.querySelector(':where(.show-audio--slider, .welcome-audio--slider) input');
    const buttonIcon = button.querySelector('.play-icon');

    if (!(audio || button)) return;

    let audioContext;
    let analyser;
    let frequencyData;

    wrapper.setAttribute('data-status', 'ready');
    wrapper.style.setProperty('--progress', 0);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleProgress);
    audio.addEventListener('ended', handleEnded);

    button.addEventListener('click', handleClick);
    button.addEventListener('dragstart', handleDragStart);

    progressSliderInput.addEventListener('input', handleSliderInput);

    function initAudioContext() {
      if (audioContext) return;

      audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const audioSrc = audioContext.createMediaElementSource(audio);

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.minDecibels = -90;
      analyser.maxDecibels = 0;

      // We have to connect the MediaElementSource with the analyser
      audioSrc.connect(analyser);

      // We could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)
      analyser.connect(audioContext.destination);

      // frequencyBinCount tells you how many values you'll receive from the analyser
      const bufferLength = analyser.frequencyBinCount;

      frequencyData = new Uint8Array(bufferLength);

      analyser.getByteTimeDomainData(frequencyData);
    }

    function renderFrame() {
      if (!audio.paused) {
        requestAnimationFrame(renderFrame);
        // update data in frequencyData
        analyser.getByteTimeDomainData(frequencyData);
        const high = frequencyData.reduce((a, v, i) => v > a ? v : a, 128);
        const low = frequencyData.reduce((a, v, i) => v < a ? v : a, 128);
        const offsetHigh = high / 128;
        const offsetLow = (128 - low + 128) / 128;

        wrapper.style.setProperty('--offset--high', offsetHigh);
        wrapper.style.setProperty('--offset--low', offsetLow);
      }
    }

    function handlePlay() {
      // initAudioContext();
      // renderFrame();
      wrapper.setAttribute('data-status', 'playing');
      buttonIcon.setAttribute('aria-label', 'Pause');
    }

    function handlePause() {
      wrapper.setAttribute('data-status', 'paused');
      buttonIcon.setAttribute('aria-label', 'Play');
    }

    function handleProgress(evt) {
      const { currentTime, duration } = audio;
      const progress = currentTime / duration;

      wrapper.style.setProperty('--progress', progress);
    }

    function handleEnded() {
      wrapper.setAttribute('data-status', 'ready');
    }

    function handleDragStart(evt) {
      console.log('drag', evt);
    }

    function handleClick() {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    }

    function handleSliderInput(evt) {
      const target = evt.target;
      const newProgress = calculateProgress(
        target.value,
        target.min,
        target.max
      );

      audio.currentTime = audio.duration * newProgress;
    }
  });

  function calculateProgress(value, min, max ) {
    const progress =
      (parseFloat(`${value}`) - parseFloat(`${min || 0}`)) /
      (parseFloat(`${max || 100}`) - parseFloat(`${min || 0}`));

    return progress;
  }
})(document, window);
