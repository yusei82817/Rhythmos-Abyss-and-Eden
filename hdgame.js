const params = new URLSearchParams(location.search);
const stageId = params.get('stage') || 'HD01';
const medleyCode = params.get('medley') || 'M01';

const KEY_TO_LANE = { a:0, s:1, d:2, j:3, k:4, l:5 };
const LANE_KEYS = ['A','S','D','J','K','L'];

const stageEl = document.getElementById('stage');
const medleyEl = document.getElementById('medley');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const lanesEl = document.getElementById('lanes');

stageEl.textContent = stageId;
medleyEl.textContent = medleyCode;

LANE_KEYS.forEach((key) => {
  const lane = document.createElement('div');
  lane.className = 'lane';
  lane.dataset.lane = String(KEY_TO_LANE[key.toLowerCase()]);
  const label = document.createElement('div');
  label.className = 'key';
  label.textContent = key;
  lane.appendChild(label);
  lanesEl.appendChild(lane);
});

let score = 0;

document.addEventListener('keydown', (event) => {
  const lane = KEY_TO_LANE[event.key.toLowerCase()];
  if (lane === undefined || event.repeat) return;
  score += 100;
  scoreEl.textContent = score;
  statusEl.textContent = `${LANE_KEYS[lane]} HIT`;
});

statusEl.textContent = `STAGE ${stageId} / MEDLEY ${medleyCode}`;
