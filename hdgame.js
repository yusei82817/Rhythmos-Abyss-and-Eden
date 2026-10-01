const params = new URLSearchParams(location.search);
const stageId = params.get('stage') || 'HD01';
const medleyCode = params.get('medley') || 'M01';

const KEY_TO_LANE = { a: 0, s: 1, d: 2, j: 4, k: 5, l: 6 };
const LANE_KEYS = ['A', 'S', 'D', 'SPACE', 'J', 'K', 'L'];

const stageEl = document.getElementById('stage');
const medleyEl = document.getElementById('medley');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const lanesEl = document.getElementById('lanes');
const gameRootEl = document.getElementById('gameRoot');
const startScreenEl = document.getElementById('startScreen');
const startButtonEl = document.getElementById('startButton');

stageEl.textContent = stageId;
medleyEl.textContent = medleyCode;

const lanes = [];
LANE_KEYS.forEach((key, index) => {
  const lane = document.createElement('div');
  lane.className = 'lane' + (index === 3 ? ' space-lane' : '');
  lane.dataset.lane = String(index);

  const label = document.createElement('div');
  label.className = 'key';
  label.textContent = key;
  lane.appendChild(label);

  lanesEl.appendChild(lane);
  lanes.push(lane);
});

const MEDLEYS = {
  M01: [
    { title: 'エメラルドヒル', src: 'エメラルドヒル.m4a' },
    { title: '創国の夜明け', src: '創国の夜明け.mp3' },
    { title: 'グローイングムーン', src: 'グローイングムーン.mp3' }
  ]
};

let score = 0;
let hits = 0;
let misses = 0;
let currentSongIndex = 0;
let audio = null;
let audioStarted = false;
let noteEngine = null;

const playlist = MEDLEYS[medleyCode] || [];

function playCurrentSong() {
  const song = playlist[currentSongIndex];
  if (!song) {
    statusEl.textContent = `FINISH  HIT ${hits} / MISS ${misses}`;
    return;
  }
  if (audio) audio.pause();
  audio = new Audio(song.src);
  audio.preload = 'auto';
  audio.volume = 1;
  audio.addEventListener('ended', () => {
    currentSongIndex++;
    playCurrentSong();
  }, { once: true });
  audio.addEventListener('error', () => {
    statusEl.textContent = `AUDIO ERROR: ${song.title}`;
    console.error('Failed to load audio:', song.src);
  }, { once: true });
  audio.play().then(() => {
    statusEl.textContent = `${song.title} / A S D SPACE J K L`;
  }).catch(err => {
    console.error(err);
    statusEl.textContent = `${song.title} / AUDIO PLAY ERROR`;
  });
}

function startGame() {
  if (audioStarted) return;

  audioStarted = true;
  gameRootEl.classList.add('started');
  startScreenEl.hidden = true;
  startScreenEl.style.display = 'none';

  noteEngine = startHDNotes({
    stageId,
    lanes,
    onHit(note, delta) {
      hits++;
      score += Math.max(50, 100 - Math.round(delta / 3));
      scoreEl.textContent = String(score);
      statusEl.textContent = `${LANE_KEYS[note.lane]} HIT`;
    },
    onMiss() {
      misses++;
      statusEl.textContent = 'MISS';
    },
    onEnd() {
      statusEl.textContent = `FINISH  HIT ${hits} / MISS ${misses}`;
    }
  });

  playCurrentSong();
}

startButtonEl.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
  if (!audioStarted || event.repeat) return;

  let lane;
  if (event.code === 'Space') lane = 3;
  else lane = KEY_TO_LANE[event.key.toLowerCase()];

  if (lane === undefined) return;
  event.preventDefault();
  noteEngine?.hitLane(lane);
});

window.addEventListener('beforeunload', () => {
  noteEngine?.stop();
  if (audio) audio.pause();
});

statusEl.textContent = playlist.length ? 'STARTを押してください' : 'MEDLEY DATA NOT FOUND';
