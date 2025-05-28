    // --- Elements ---
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('play');
    const stopBtn = document.getElementById('stop');
    const rewindBtn = document.getElementById('rewind');
    const songTitleElement = document.getElementById('song-title');
    const artistNameElement = document.getElementById('artist-name');
    const streamStatus = document.getElementById('stream-status');
    const offlineDiv = document.getElementById('offline');
    const visualizer = document.getElementById('visualizer');

    // --- Visualizer setup ---
    const barCount = 32;
    let bars = [];
    for(let i=0; i<barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = '12px';
      visualizer.appendChild(bar);
      bars.push(bar);
    }

    // --- Stream Play/Stop Logic ---
    let isPlaying = false;
    playBtn.addEventListener('click', () => {
      if (!isPlaying) {
        audio.src = "https://listen.ramashamedia.com:8330/stream";
        audio.load();
        audio.play().catch(err => {
          offlineDiv.style.display = "block";
          streamStatus.textContent = "Offline";
        });
        isPlaying = true;
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        streamStatus.textContent = 'Playing';
        offlineDiv.style.display = "none";
      } else {
        audio.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        streamStatus.textContent = 'Paused';
      }
    });

    stopBtn.addEventListener('click', () => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = ""; // Unload stream for true stop
      isPlaying = false;
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      streamStatus.textContent = 'Stopped';
    });

    // Rewind (seek back 10s if possible, else restart)
    rewindBtn.addEventListener('click', () => {
      if (audio.currentTime > 10) {
        audio.currentTime -= 10;
      } else {
        audio.currentTime = 0;
      }
    });

    // --- Fetch & Display Song Title ---
    async function updateSongInfo() {
      try {
        // Use a CORS proxy for Shoutcast song info
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = encodeURIComponent('https://listen.ramashamedia.com:8330/currentsong?sid=1');
        const response = await fetch(proxyUrl + targetUrl);
        const songTitle = await response.text();
        let artist = 'Ramasha Media';
        let title = songTitle.trim();
        if (title && title.includes(' - ')) {
          [artist, title] = title.split(' - ', 2);
        }
        songTitleElement.textContent = title || 'No track information';
        artistNameElement.textContent = artist;
      } catch (error) {
        songTitleElement.textContent = 'No track information';
        artistNameElement.textContent = 'Ramasha Media';
      }
    }
    updateSongInfo();
    setInterval(updateSongInfo, 10000);

    // --- Audio Visualizer ---
    let ctx, analyser, source, freqData;
    function setupVisualizer() {
      if (!window.AudioContext) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyser.fftSize = 64;
      freqData = new Uint8Array(analyser.frequencyBinCount);

      function draw() {
        requestAnimationFrame(draw);
        if (!isPlaying) return;
        analyser.getByteFrequencyData(freqData);
        for (let i = 0; i < barCount; i++) {
          let h = Math.max(12, freqData[i] / 2.2);
          bars[i].style.height = h + "px";
        }
      }
      draw();
    }
    audio.addEventListener('play', setupVisualizer, { once: true });

    // --- Offline/Ended Handling ---
    audio.addEventListener('ended', () => {
      isPlaying = false;
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      streamStatus.textContent = 'Stopped';
    });
    audio.addEventListener('pause', () => {
      if (!audio.src) {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        streamStatus.textContent = 'Stopped';
      }
    });
    audio.onerror = function() {
      offlineDiv.style.display = "block";
      streamStatus.textContent = "Offline";
    };