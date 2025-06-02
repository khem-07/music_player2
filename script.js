const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
// const rewindBtn = document.getElementById('rewind'); // Rewind button removed from here
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
    imageContainer.style.height = '100%'; // Will inherit height from visualizer-row
    imageContainer.style.display = 'flex';
    imageContainer.style.justifyContent = 'center';
    imageContainer.style.alignItems = 'center';
    imageContainer.style.overflow = 'hidden';

    const img = document.createElement('img');
    img.alt = 'Music visualizer fallback image';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'cover'; // Use cover to fill the space better
    img.style.display = 'block';
    img.style.borderRadius = '8px'; // Optional: match visualizer bar styling

    imageContainer.appendChild(img);
    visualizer.parentNode.insertBefore(imageContainer, visualizer);
}

// --- Audio Context Variables ---
let ctx, analyser, source, freqData;
let isPlaying = false;
let isStopped = true; // Track stopped state

function setupVisualizer() {
    if (isSafari || !window.AudioContext) return; // Exit if Safari or AudioContext not supported

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

// --- Random Image Fetch for Safari (using Picsum Photos) ---
function displayRandomImage() {
    if (!isSafari) return;
    const imageContainer = document.getElementById('image-container');
    const imgElement = imageContainer.querySelector('img');

    if (!imgElement) {
        console.error('Image element not found in #image-container for Safari fallback.');
        return;
    }

    // Using Picsum Photos API: https://picsum.photos/
    // /seed/{seed} provides a consistent image for a given seed (good for refresh)
    // /width/height provides a random image of that size
    // We'll use a random ID for "randomness" with a seed for consistency if reloaded.
    const randomSeed = Math.floor(Math.random() * 1000); // A number between 0 and 999
    // Request an HD image, e.g., 1200x800
    const imageUrl = `https://picsum.photos/seed/${randomSeed}/1200/800`;
    imgElement.src = imageUrl;

    imgElement.onerror = () => {
        console.warn('Picsum image failed to load, displaying error message.');
        // Display a more prominent error if the image can't be loaded
        imageContainer.innerHTML = '<p style="color: #fa225b; font-size: 0.9em; text-align: center;">Unable to load image (check internet or API)</p>';
    };
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

// Rewind button event listener removed
// rewindBtn.addEventListener('click', () => {
//     try {
//         if (audio.currentTime > 10) {
//             audio.currentTime -= 10;
//         } else {
//             audio.currentTime = 0;
//         }
//     } catch (e) {
//         // For live streams, may not work
//     }
// });

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
    setInterval(displayRandomImage, 60000); // Refresh image every 60 seconds
    displayRandomImage(); // Initial image load
}