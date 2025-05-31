// // --- Elements ---
// const audio = document.getElementById('audio');
// const playBtn = document.getElementById('play');
// const stopBtn = document.getElementById('stop');
// const rewindBtn = document.getElementById('rewind');
// const songTitleElement = document.getElementById('song-title');
// const artistNameElement = document.getElementById('artist-name');
// const streamStatus = document.getElementById('stream-status');
// const offlineDiv = document.getElementById('offline');
// const visualizer = document.getElementById('visualizer');

// // --- Visualizer setup ---
// const barCount = 32;
// const bars = [];
// for (let i = 0; i < barCount; i++) {
//   const bar = document.createElement('div');
//   bar.className = 'bar';
//   bar.style.height = '12px';
//   visualizer.appendChild(bar);
//   bars.push(bar);
// }

// // --- Audio Context Variables ---
// let ctx, analyser, source, freqData;
// let isPlaying = false;
// let isStopped = true; // Track stopped state

// function setupVisualizer() {
//   if (!window.AudioContext) return;

//   // Clean up existing audio context if present
//   if (ctx && ctx.state !== 'closed') {
//     ctx.close();
//   }

//   ctx = new (window.AudioContext || window.webkitAudioContext)();
//   analyser = ctx.createAnalyser();
//   source = ctx.createMediaElementSource(audio);
//   source.connect(analyser);
//   analyser.connect(ctx.destination);
//   analyser.fftSize = 64;
//   freqData = new Uint8Array(analyser.frequencyBinCount);

//   function draw() {
//     requestAnimationFrame(draw);
//     if (!isPlaying) return;
//     analyser.getByteFrequencyData(freqData);
//     for (let i = 0; i < barCount; i++) {
//       const height = Math.max(12, freqData[i] / 2.2);
//       bars[i].style.height = `${height}px`;
//     }
//   }
//   draw();
// }

// // --- Playback Logic ---
// const STREAM_URL = "https://listen.ramashamedia.com:8330/stream";

// // Always keep the stream loaded initially
// audio.src = STREAM_URL;
// audio.preload = "auto";
// audio.load();

// playBtn.addEventListener('click', async () => {
//   if (isPlaying) {
//     // Treat pause like stop to flush buffer
//     audio.pause();
//     audio.src = ''; // Clear stream
//     isPlaying = false;
//     playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
//     streamStatus.textContent = 'Stopped';
//     bars.forEach(bar => bar.style.height = '12px');
//   } else {
//     try {
//       // Reassign stream to force live reconnect
//       audio.src = STREAM_URL;
//       audio.load();
//       await audio.play();

//       isPlaying = true;
//       isStopped = false;
//       playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
//       streamStatus.textContent = 'Playing';
//       offlineDiv.style.display = "none";

//       if (!ctx || ctx.state === 'closed') {
//         setupVisualizer();
//       }
//     } catch (e) {
//       offlineDiv.style.display = "block";
//       streamStatus.textContent = "Offline";
//       console.warn('Playback failed:', e.message);
//     }
//   }
// });

// stopBtn.addEventListener('click', () => {
//   audio.pause();
//   try {
//     audio.currentTime = 0;
//   } catch (e) {
//     // For live streams, may not reset
//   }
//   audio.src = ''; // Clear stream on stop
//   isPlaying = false;
//   isStopped = true;
//   playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
//   streamStatus.textContent = 'Stopped';
//   bars.forEach(bar => bar.style.height = '12px');
// });

// rewindBtn.addEventListener('click', () => {
//   try {
//     if (audio.currentTime > 10) {
//       audio.currentTime -= 10;
//     } else {
//       audio.currentTime = 0;
//     }
//   } catch (e) {
//     // For live streams, may not work
//   }
// });

// // --- Song Info Fetch ---
// async function updateSongInfo() {
//   try {
//     const proxyUrl = 'https://api.allorigins.win/get?url=';
//     const targetUrl = encodeURIComponent('https://listen.ramashamedia.com:8330/currentsong?sid=1');
//     const response = await fetch(proxyUrl + targetUrl);

//     if (!response.ok) throw new Error('Failed to fetch');

//     const data = await response.json();
//     const clean = data.contents.trim();
//     let artist = 'Ramasha Media';
//     let title = clean;

//     if (clean.includes(' - ')) {
//       [artist, title] = clean.split(' - ', 2);
//     }

//     songTitleElement.textContent = title || 'No track information';
//     artistNameElement.textContent = artist || 'Ramasha Media';
//   } catch (e) {
//     songTitleElement.textContent = 'No track information';
//     artistNameElement.textContent = 'Ramasha Media';
//     console.warn('Song info fetch failed:', e.message);
//   }
// }

// // --- Events ---
// audio.addEventListener('ended', () => {
//   isPlaying = false;
//   isStopped = true;
//   playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
//   streamStatus.textContent = 'Stopped';
// });

// audio.addEventListener('pause', () => {
//   if (audio.ended || audio.error) {
//     isPlaying = false;
//     isStopped = true;
//     playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
//     streamStatus.textContent = 'Stopped';
//   }
// });

// audio.addEventListener('error', () => {
//   offlineDiv.style.display = "block";
//   streamStatus.textContent = "Offline";
// });

// // --- Initialization ---
// updateSongInfo();
// setInterval(updateSongInfo, 10000);


const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const rewindBtn = document.getElementById('rewind');
const songTitleElement = document.getElementById('song-title');
const artistNameElement = document.getElementById('artist-name');
const streamStatus = document.getElementById('stream-status');
const offlineDiv = document.getElementById('offline');
const visualizer = document.getElementById('visualizer');

// --- Check if browser is Safari ---
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// --- Visualizer setup (for non-Safari browsers) ---
const barCount = 32;
const bars = [];
if (!isSafari) {
  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = '12px';
    visualizer.appendChild(bar);
    bars.push(bar);
  }
} else {
  // Hide visualizer on Safari
  visualizer.style.display = 'none';
  // Create image container for Safari
  const imageContainer = document.createElement('div');
  imageContainer.id = 'image-container';
  imageContainer.style.width = '100%';
  imageContainer.style.height = '100px';
  imageContainer.style.overflow = 'hidden';
  visualizer.parentNode.insertBefore(imageContainer, visualizer);
}

// --- Audio Context Variables ---
let ctx, analyser, source, freqData;
let isPlaying = false;
let isStopped = true; // Track stopped state

function setupVisualizer() {
  if (isSafari || !window.AudioContext) return;

  // Clean up existing audio context if present
  if (ctx && ctx.state !== 'closed') {
    ctx.close();
  }

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
      const height = Math.max(12, freqData[i] / 2.2);
      bars[i].style.height = `${height}px`;
    }
  }
  draw();
}

// --- Random Image Fetch for Safari ---
async function displayRandomImage() {
  if (!isSafari) return;
  const imageContainer = document.getElementById('image-container');
  try {
    const response = await fetch('https://api.unsplash.com/photos/random?client_id=6vD5z1b0J6tG9Z9g0X7Y5Z8J2b7Y5Z8J2b7Y5Z8J2b7Y5Z8');
    const data = await response.json();
    const img = document.createElement('img');
    img.src = data.urls.small;
    img.alt = data.alt_description || 'Random image';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    imageContainer.innerHTML = ''; // Clear previous image
    imageContainer.appendChild(img);
  } catch (e) {
    console.warn('Failed to fetch image:', e.message);
    imageContainer.innerHTML = '<p>Unable to load image</p>';
  }
}

// --- Playback Logic ---
const STREAM_URL = "https://listen.ramashamedia.com:8330/stream";

// Always keep the stream loaded initially
audio.src = STREAM_URL;
audio.preload = "auto";
audio.load();

playBtn.addEventListener('click', async () => {
  if (isPlaying) {
    // Treat pause like stop to flush buffer
    audio.pause();
    audio.src = ''; // Clear stream
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    streamStatus.textContent = 'Stopped';
    if (!isSafari) {
      bars.forEach(bar => bar.style.height = '12px');
    } else {
      displayRandomImage(); // Refresh image on pause
    }
  } else {
    try {
      // Reassign stream to force live reconnect
      audio.src = STREAM_URL;
      audio.load();
      await audio.play();

      isPlaying = true;
      isStopped = false;
      playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      streamStatus.textContent = 'Playing';
      offlineDiv.style.display = "none";

      if (!isSafari && (!ctx || ctx.state === 'closed')) {
        setupVisualizer();
      } else if (isSafari) {
        displayRandomImage(); // Show image on play
      }
    } catch (e) {
      offlineDiv.style.display = "block";
      streamStatus.textContent = "Offline";
      console.warn('Playback failed:', e.message);
    }
  }
});

stopBtn.addEventListener('click', () => {
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch (e) {
    // For live streams, may not reset
  }
  audio.src = ''; // Clear stream on stop
  isPlaying = false;
  isStopped = true;
  playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  streamStatus.textContent = 'Stopped';
  if (!isSafari) {
    bars.forEach(bar => bar.style.height = '12px');
  } else {
    displayRandomImage(); // Refresh image on stop
  }
});

rewindBtn.addEventListener('click', () => {
  try {
    if (audio.currentTime > 10) {
      audio.currentTime -= 10;
    } else {
      audio.currentTime = 0;
    }
  } catch (e) {
    // For live streams, may not work
  }
});

// --- Song Info Fetch ---
async function updateSongInfo() {
  try {
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const targetUrl = encodeURIComponent('https://listen.ramashamedia.com:8330/currentsong?sid=1');
    const response = await fetch(proxyUrl + targetUrl);

    if (!response.ok) throw new Error('Failed to fetch');

    const data = await response.json();
    const clean = data.contents.trim();
    let artist = 'Ramasha Media';
    let title = clean;

    if (clean.includes(' - ')) {
      [artist, title] = clean.split(' - ', 2);
    }

    songTitleElement.textContent = title || 'No track information';
    artistNameElement.textContent = artist || 'Ramasha Media';
  } catch (e) {
    songTitleElement.textContent = 'No track information';
    artistNameElement.textContent = 'Ramasha Media';
    console.warn('Song info fetch failed:', e.message);
  }
}

// --- Events ---
audio.addEventListener('ended', () => {
  isPlaying = false;
  isStopped = true;
  playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  streamStatus.textContent = 'Stopped';
  if (isSafari) {
    displayRandomImage(); // Refresh image on end
  }
});

audio.addEventListener('pause', () => {
  if (audio.ended || audio.error) {
    isPlaying = false;
    isStopped = true;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    streamStatus.textContent = 'Stopped';
    if (isSafari) {
      displayRandomImage(); // Refresh image on pause
    }
  }
});

audio.addEventListener('error', () => {
  offlineDiv.style.display = "block";
  streamStatus.textContent = "Offline";
  if (isSafari) {
    displayRandomImage(); // Refresh image on error
  }
});

// --- Initialization ---
updateSongInfo();
setInterval(updateSongInfo, 10000);
if (isSafari) {
  setInterval(displayRandomImage, 30000); // Refresh image every 30 seconds
  displayRandomImage(); // Initial image load
}