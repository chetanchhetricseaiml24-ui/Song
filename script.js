const audio = document.getElementById("bg-music");
const toggleBtn = document.getElementById("toggle-btn");
const btnLabel = document.getElementById("btn-label");
const breathGuide = document.getElementById("breath-guide");
const orbWrapper = document.getElementById("orb-wrapper");
const volumeSlider = document.getElementById("volume-slider");
const muteBtn = document.getElementById("mute-btn");
const sessionTime = document.getElementById("session-time");

let breathInterval = null;
let timerInterval = null;
let seconds = 0;

/* ---------- Music: always repeats ---------- */
audio.loop = true;
// Safety net in case a browser ignores `loop` for a given file
audio.addEventListener("ended", () => {
  audio.currentTime = 0;
  audio.play();
});

/* ---------- Breath text (synced to the 8s CSS cycle: 4s in, 4s out) ---------- */
function setGuide(text) {
  breathGuide.classList.add("fade");
  setTimeout(() => {
    breathGuide.textContent = text;
    breathGuide.classList.remove("fade");
  }, 300);
}

function startBreathingPrompts() {
  clearInterval(breathInterval);
  let inhaling = true;
  breathGuide.textContent = "Breathe in…";
  breathInterval = setInterval(() => {
    inhaling = !inhaling;
    setGuide(inhaling ? "Breathe in…" : "Breathe out…");
  }, 4000);
}

function stopBreathingPrompts(message) {
  clearInterval(breathInterval);
  breathInterval = null;
  breathGuide.textContent = message;
}

/* ---------- Session timer ---------- */
function renderTime() {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  sessionTime.textContent = `${m}:${s}`;
}
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => { seconds++; renderTime(); }, 1000);
}
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

/* ---------- UI state ---------- */
function updateUI(isPlaying) {
  document.body.classList.toggle("playing", isPlaying);
  orbWrapper.classList.toggle("breathing", isPlaying);

  if (isPlaying) {
    btnLabel.textContent = "Pause";
    toggleBtn.setAttribute("aria-label", "Pause");
    startBreathingPrompts();
    startTimer();
  } else {
    const started = seconds > 0;
    btnLabel.textContent = started ? "Resume" : "Begin session";
    toggleBtn.setAttribute("aria-label", started ? "Resume" : "Begin session");
    stopBreathingPrompts(started ? "Session paused" : "Press play when you're ready");
    stopTimer();
  }
}

function play() {
  return audio.play().then(() => updateUI(true)).catch(() => {
    stopBreathingPrompts("Music.mp3 could not be played. Check that the file is in the same folder.");
    updateUI(false);
  });
}

toggleBtn.addEventListener("click", () => {
  if (audio.paused) play();
  else { audio.pause(); updateUI(false); }
});

/* ---------- Volume ---------- */
function paintSlider() {
  volumeSlider.style.setProperty("--fill", `${volumeSlider.value * 100}%`);
}
audio.volume = volumeSlider.value;
paintSlider();

volumeSlider.addEventListener("input", (e) => {
  audio.volume = e.target.value;
  audio.muted = false;
  muteBtn.classList.toggle("muted", Number(e.target.value) === 0);
  paintSlider();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("muted", audio.muted);
  muteBtn.setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
});

/* ---------- Autoplay attempt ---------- */
window.addEventListener("DOMContentLoaded", () => {
  audio.play()
    .then(() => updateUI(true))
    .catch(() => updateUI(false)); // browser blocked autoplay: wait for the button
});

/* ---------- Drifting motes (slow, quiet background) ---------- */
(() => {
  const canvas = document.getElementById("motes");
  const ctx = canvas.getContext("2d");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let w, h, motes;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const count = Math.round(Math.min(70, innerWidth / 18));
    motes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.4 + 0.4) * dpr,
      vy: -(Math.random() * 0.15 + 0.03) * dpr,
      vx: (Math.random() - 0.5) * 0.08 * dpr,
      a: Math.random() * Math.PI * 2,
      s: Math.random() * 0.01 + 0.004,
    }));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy; m.a += m.s;
      if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
      const alpha = 0.25 + 0.35 * Math.sin(m.a);
      ctx.beginPath();
      ctx.fillStyle = `rgba(244,214,164,${Math.max(alpha, 0.05)})`;
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  addEventListener("resize", resize);
  resize();
  frame();
})();