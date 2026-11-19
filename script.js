const countdownDate = new Date("December 25, 2026 00:00:00").getTime();

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const messageEl = document.getElementById("message");
const magicButton = document.getElementById("magic-btn");
const santaContainer = document.getElementById("santa-container");
const santaImg = document.getElementById("santa-img");
const canvas = document.getElementById("snowCanvas");
const ctx = canvas.getContext("2d");

// --- Countdown ---
const pad = (value) => String(value).padStart(2, "0");
let countdownTimer = null;
let lastMessage = "";

function setMessage(text) {
    if (!messageEl || text === lastMessage) return;
    lastMessage = text;
    messageEl.textContent = text;
}

function updateCountdown() {
    const distance = countdownDate - Date.now();

    if (distance <= 0) {
        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = null;
        const box = document.querySelector(".countdown-box");
        if (box) box.hidden = true;
        const title = document.querySelector(".title");
        if (title) title.textContent = "🎄 Merry Christmas, River! 🎄";
        setMessage("Santa is here. Have the best day!");
        return;
    }

    const days = Math.floor(distance / 86400000);
    const hours = Math.floor((distance % 86400000) / 3600000);
    const minutes = Math.floor((distance % 3600000) / 60000);
    const seconds = Math.floor((distance % 60000) / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
    if (!isMagicPlaying) {
        setMessage(days === 0
            ? "Christmas is today!"
            : `${days} ${days === 1 ? "sleep" : "sleeps"} until Christmas`);
    }
}

countdownTimer = setInterval(updateCountdown, 1000);

// --- Snow ---
let particles = [];
const particleCount = 100;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 1 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.3;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y > canvas.height) {
            this.y = -10;
            this.x = Math.random() * canvas.width;
        }
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

for (let i = 0; i < particleCount; i++) particles.push(new Particle());

function animateSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateSnow);
}
animateSnow();

// --- Music and dancing Santa ---
// One player for the whole set. iOS Safari only unlocks audio reliably on a single element that
// was started by a real tap, so every carol reuses this one and plays from start to finish.
const player = document.getElementById("player");
const TRACKS = [
    { src: "uploads/atlasaudio-christmas-spirit-621551.mp3", dance: "uploads/santa-christmas-spirit.gif" },
    { src: "uploads/atlasaudio-happy-christmas-621570.mp3", dance: "uploads/santa-happy-christmas.gif" },
    { src: "uploads/atlasaudio-merry-christmas-617590.mp3", dance: "uploads/santa-merry-christmas.gif" },
    { src: "uploads/bfcmusic-christmas-party-time-249613.mp3", dance: "uploads/santa-party-time.gif" },
    { src: "uploads/jonasblakewood-christmas-christmas-music-593976.mp3", dance: "uploads/santa-jonas-christmas.gif" },
    { src: "uploads/tunetank-christmas-jazz-christmas-holiday-347485.mp3", dance: "uploads/santa-jazz-holiday.gif" },
];
let trackIndex = 0;
let isMagicPlaying = false;

function showDanceFor(track) {
    if (santaImg && track.dance && santaImg.getAttribute("src") !== track.dance) {
        santaImg.setAttribute("src", track.dance);
    }
}

function playTrack(index) {
    trackIndex = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
    const track = TRACKS[trackIndex];
    showDanceFor(track);
    player.src = track.src;
    player.load();
    const started = player.play();
    if (started && typeof started.catch === "function") {
        started.catch(() => {
            // Safari refused without a fresh gesture: return to the start state so one tap retries.
            stopMagic();
            setMessage("Tap Start the Magic to allow sound");
        });
    }
}

player.addEventListener("ended", () => {
    if (isMagicPlaying) playTrack(trackIndex + 1);
});

function startMagic() {
    isMagicPlaying = true;
    
    // 1. Show Santa immediately so the user sees feedback
    santaContainer.classList.remove("santa-hidden");
    santaContainer.classList.add("santa-dancing");
    
    // 2. Update Button UI
    magicButton.textContent = "✨ Stop the Magic! ✨";
    magicButton.setAttribute("aria-pressed", "true");
    setMessage("Ho ho ho! 🎅");

    // 3. Attempt to play music
    playTrack(0);
}

function stopMagic() {
    isMagicPlaying = false;
    player.pause();
    player.currentTime = 0;
    santaContainer.classList.add("santa-hidden");
    santaContainer.classList.remove("santa-dancing");
    magicButton.textContent = "✨ Start the Magic! ✨";
    magicButton.setAttribute("aria-pressed", "false");
    setMessage("");
    updateCountdown();
}

magicButton.addEventListener("click", () => {
    if (isMagicPlaying) stopMagic();
    else startMagic();
});

updateCountdown();

// Installable app: cache the shell and the dances for offline use, songs cache as they play.
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => {});
    });
}
