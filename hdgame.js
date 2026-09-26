const params = new URLSearchParams(location.search);
const stageId = params.get('stage') || 'HD01';
const medleyCode = params.get('medley') || 'M01';

const KEY_TO_LANE = { a: 0, s: 1, d: 2, j: 3, k: 4, l: 5 };
const LANE_KEYS = ['A', 'S', 'D', 'J', 'K', 'L'];

const stageEl = document.getElementById('stage');
const medleyEl = document.getElementById('medley');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const lanesEl = document.getElementById('lanes');

stageEl.textContent = stageId;
medleyEl.textContent = medleyCode;

const lanes = [];
LANE_KEYS.forEach((key) => {
  const lane = document.createElement('div');
  lane.className = 'lane';
  lane.dataset.lane = String(KEY_TO_LANE[key.toLowerCase()]);

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

const MEDLEYS = {
  M01: [
    { title: 'エメラルドヒル', src: 'エメラルドヒル.m4a' },
    { title: '創国の夜明け', src: '創国の夜明け.mp3' },
    { title: 'グローイングムーン', src: 'グローイングムーン.mp3' }
  ]
};
const playlist = MEDLEYS[medleyCode] || [];

function playCurrentSong() {
  const song = playlist[currentSongIndex];
  if (!song) { statusEl.textContent = `FINISH  HIT ${hits} / MISS ${misses}`; return; }
  if (audio) audio.pause();
  audio = new Audio(song.src);
  audio.preload = 'auto';
  audio.volume = 1;
  audio.addEventListener('ended', () => {
    currentSongIndex++;
    playCurrentSong();
  }, { once:true });
  audio.addEventListener('error', () => {
    statusEl.textContent = `AUDIO ERROR: ${song.title}`;
    console.error('Failed to load audio:', song.src);
  }, { once:true });
  audio.play().then(() => {
    audioStarted = true;
    statusEl.textContent = `${song.title} / A S D J K L`;
  }).catch(err => console.error(err));
}

function startGame() {
  if (audioStarted) return;
  document.getElementById('gameRoot').classList.add('started');
  audioStarted = true;
  noteEngine = startHDNotes({
    stageId,
    lanes,
    onHit(note, delta) {
      hits++;
      score += Math.max(50, 100 - Math.round(delta / 3));
      scoreEl.textContent = String(score);
      statusEl.textContent = `${LANE_KEYS[note.lane]} HIT`;
    },
    onMiss() { misses++; statusEl.textContent = 'MISS'; },
    onEnd() { statusEl.textContent = `FINISH  HIT ${hits} / MISS ${misses}`; }
  });
  playCurrentSong();
}

document.getElementById('startButton').addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
  const lane = KEY_TO_LANE[event.key.toLowerCase()];
  if (!audioStarted || lane === undefined || event.repeat) return;
  noteEngine?.hitLane(lane);
});

window.addEventListener('beforeunload', () => {
  noteEngine?.stop();
  if (audio) audio.pause();
});

statusEl.textContent = playlist.length ? 'STARTを押してください' : 'MEDLEY DATA NOT FOUND';
