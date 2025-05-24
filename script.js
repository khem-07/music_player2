const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const rewindBtn = document.getElementById('rewind');
const progress = document.getElementById('progress');
const songTitleElement = document.getElementById('song-title');
const artistNameElement = document.getElementById('artist-name');
const streamStatus = document.getElementById('stream-status');

// --- Stream Start/Stop Logic (no pause) ---
let isPlaying = false;
playBtn.addEventListener('click', () => {
  if (!isPlaying) {
    audio.src = "https://listen.ramashamedia.com:8330/stream";
    audio.load();
    audio.play().catch(err => console.error('Playback error:', err));
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    streamStatus.textContent = 'Playing';
  }
});

stopBtn.addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
  audio.src = ""; // Unload stream for true stop
  isPlaying = false;
  playBtn.innerHTML = '<i class="fa-solid fa-play">';
  progress.style.width = '0%';
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
async function updateSongTitle() {
  try {
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = encodeURIComponent('https://listen.ramashamedia.com/8330/currentsong?sid=1');
    const response = await fetch(proxyUrl + targetUrl);
    const songTitle = await response.text();
    if (songTitle && songTitle.trim()) {
      if (songTitle.includes(' - ')) {
        const [artist, title] = songTitle.split(' - ', 2);
        songTitleElement.textContent = title.trim();
        artistNameElement.textContent = artist.trim();
      } else {
        songTitleElement.textContent = songTitle.trim();
        artistNameElement.textContent = 'Ramasha Media';
      }
    } else {
      songTitleElement.textContent = 'No track information';
      artistNameElement.textContent = 'Ramasha Media';
    }
  } catch (error) {
    songTitleElement.textContent = 'No track information';
    artistNameElement.textContent = 'Ramasha Media';
  }
}
updateSongTitle();
setInterval(updateSongTitle, 10000);

// Reset UI if stream ends unexpectedly
audio.addEventListener('ended', () => {
  isPlaying = false;
  playBtn.innerHTML = '▶';
  progress.style.width = '0%';
  streamStatus.textContent = 'Stopped';
});
audio.addEventListener('pause', () => {
  if (!audio.src) {
    isPlaying = false;
    playBtn.innerHTML = '▶';
    progress.style.width = '0%';
    streamStatus.textContent = 'Stopped';
  }
});
