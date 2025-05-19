const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const rewindBtn = document.getElementById('rewind');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');
const currentTime = document.getElementById('current-time');
const duration = document.getElementById('duration');
const songTitleElement = document.getElementById('song-title');
const artistNameElement = document.getElementById('artist-name');

// Format time in MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Update duration for streams
audio.addEventListener('loadedmetadata', () => {
    duration.textContent = audio.duration ? formatTime(audio.duration) : 'Live';
});

// Update current time
audio.addEventListener('timeupdate', () => {
    currentTime.textContent = formatTime(audio.currentTime);
});

// Play button
playBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play().catch(err => console.error('Playback error:', err));
        playBtn.innerHTML = '❙❙';
    } else {
        audio.pause();
        playBtn.innerHTML = '▶';
    }
});

// Stop button
stopBtn.addEventListener('click', () => {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '▶';
    progress.style.width = '0%';
});

// Rewind button
rewindBtn.addEventListener('click', () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
});

// Fetch and display current song title using CORS proxy
async function updateSongTitle() {
    try {
        // Use corsproxy.io to bypass CORS restrictions
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = encodeURIComponent('https://listen.ramashamedia.com/8330/currentsong?sid=1');
        const response = await fetch(proxyUrl + targetUrl);
        const songTitle = await response.text();
        console.log('Song Title:', songTitle); // Debug
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
        console.error('Error fetching song title:', error);
        songTitleElement.textContent = 'No track information';
        artistNameElement.textContent = 'Ramasha Media';
    }
}

// Update song title initially and every 10 seconds
updateSongTitle();
setInterval(updateSongTitle, 10000);
