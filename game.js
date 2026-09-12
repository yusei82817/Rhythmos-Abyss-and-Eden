import { judgeNote } from './judgment.js?v=2';

const glitch = document.getElementById("glitch");
const bgm = document.getElementById('bgm');
const container = document.getElementById('game-container');
const gameBg = document.getElementById('game-bg');
const flash = document.getElementById('flash-overlay');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo-num');
const judgeEl = document.getElementById('judge-text');

let score = 0;
let combo = 0;
let perfect = 0;
let success = 0;
let great = 0;
let miss = 0;
let isPlaying = false;
let activeNotes = [];
let chart = [];
let currentMode = '';
let noteSpeed = 500;
let judgmentY = 520;

const timerEl = document.createElement('div');
timerEl.id = 'song-timer';
timerEl.innerText = '00:00.00';
Object.assign(timerEl.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '9999',
    fontSize: '24px',
    fontFamily: 'monospace',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.55)',
    padding: '6px 10px',
    borderRadius: '4px',
    pointerEvents: 'none'
});
document.body.appendChild(timerEl);

function updateTimer() {
    const time = bgm.currentTime || 0;
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const hundredths = Math.floor((time % 1) * 100);
    timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

function glitchEffect() {
    if (!glitch) return;
    glitch.classList.add("glitch-on");
    setTimeout(() => glitch.classList.remove("glitch-on"), 150);
}

setInterval(() => {
    if (Math.random() < 0.15) glitchEffect();
}, 5000);

function createWave() {
    const wave = document.createElement("div");
    wave.className = "wave-effect";
    wave.style.left = "50%";
    wave.style.top = "80%";
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) gameContainer.appendChild(wave);
    setTimeout(() => wave.remove(), 500);
}

async function initGame(src, mode, bgImage = '') {
    if (!src || !mode) {
        console.error('エラー: src または mode が指定されていません。');
        return;
    }

    const menuBgm = document.getElementById('menu-bgm');
    if (menuBgm) {
        menuBgm.pause();
        menuBgm.currentTime = 0;
    }

    score = 0;
    combo = 0;
    perfect = 0;
    success = 0;
    great = 0;
    miss = 0;
    activeNotes = [];
    scoreEl.innerText = "000000";
    comboEl.innerText = "";
    judgeEl.innerText = "";
    timerEl.innerText = '00:00.00';

    bgm.src = src;
    currentMode = mode;
    container.className = '';
    gameBg.style.backgroundImage = bgImage ? `url(${bgImage})` : '';

    if (mode === 'ボス猫の手下') {
        container.classList.add('white-style');
        noteSpeed = 750;
    } else {
        noteSpeed = 550;
    }

    const selectScreen = document.getElementById('select-screen');
    if (selectScreen) selectScreen.style.display = 'none';

    await loadChart(src);
    isPlaying = true;

    bgm.play()
        .then(() => requestAnimationFrame(update))
        .catch(err => console.error('BGMの再生に失敗しました。ユーザーの操作が必要です:', err));
}

window.initGame = initGame;

async function loadChart(src) {
    const path = location.pathname.toLowerCase();
    const folder = path.endsWith('gfgame.html') ? 'abc' : 'edc';
    const audioName = decodeURIComponent(src.split('/').pop() || '');
    const chartName = audioName.replace(/\.[^.]+$/, '');
    const chartPath = `chart/${folder}/${encodeURIComponent(chartName)}.json`;

    try {
        const response = await fetch(chartPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const chartData = await response.json();
        const offset = Number(chartData.offset) || 0;

        chart = Array.isArray(chartData.notes)
            ? chartData.notes.map(note => ({
                time: Number(note.time) + offset,
                lane: Number(note.lane),
                type: note.type || 'normal'
            }))
            : [];

        chart.sort((a, b) => a.time - b.time);
        console.log(`固定譜面を読み込みました: ${chartPath} / ${chart.length} notes`);
    } catch (error) {
        console.warn(`固定譜面が見つからないため、ランダム譜面を使用します: ${chartPath}`, error);
        generateRandomChart(currentMode);
    }
}

function generateRandomChart(mode) {
    chart = [];
    const endSeconds = 150;
    const bpm = (mode === 'ボス猫の手下') ? 160 : 120;
    const secPerBeat = 60 / bpm;

    for (let beat = 0; beat <= (endSeconds / secPerBeat); beat += 0.25) {
        const time = beat * secPerBeat + 0.8;
        if (Math.random() < 0.25) {
            chart.push({
                time,
                lane: Math.floor(Math.random() * 4),
                type: 'normal'
            });
        }
    }
    chart.sort((a, b) => a.time - b.time);
}

function update() {
    if (!isPlaying) return;
    const now = bgm.currentTime;
    updateTimer();

    while (chart.length > 0 && chart[0].time <= now + 1.2) {
        const data = chart.shift();
        const el = document.createElement('div');
        el.className = 'note';

        const laneEl = document.getElementById(`lane-${data.lane}`);
        if (laneEl) laneEl.appendChild(el);

        activeNotes.push({
            el,
            lane: data.lane,
            targetTime: data.time,
            hit: false
        });
    }

    for (let i = activeNotes.length - 1; i >= 0; i--) {
        const n = activeNotes[i];
        const diff = n.targetTime - now;

        n.el.style.top = (judgmentY - diff * noteSpeed) + 'px';

        if (currentMode === 'ボス猫の手下' && diff < 0.25) {
            n.el.style.opacity = Math.max(0, diff * 4);
        }

        if (diff < -0.15 && !n.hit) {
            n.hit = true;
            combo = 0;
            comboEl.innerText = "";
            judgeEl.innerText = "MISS";
            miss++;
            judgeEl.style.color = "#888";
        }

        if (diff < -0.3) {
            n.el.remove();
            activeNotes.splice(i, 1);
        }
    }
    requestAnimationFrame(update);
}

bgm.addEventListener('ended', () => {
    isPlaying = false;
    activeNotes.forEach(note => note.el.remove());
    activeNotes = [];
    updateTimer();

    localStorage.setItem("score", score);
    localStorage.setItem("perfect", perfect);
    localStorage.setItem("success", success);
    localStorage.setItem("great", great);
    localStorage.setItem("miss", miss);

    score = 0;
    combo = 0;
    scoreEl.innerText = "000000";
    comboEl.innerText = "";
    judgeEl.innerText = "";

    if (location.pathname.toLowerCase().endsWith('gfgame.html')) {
        location.href = "gfresult.html";
    } else {
        location.href = "spresult.html";
    }
});

window.addEventListener('keydown', (e) => {
    const keys = { 'a': 0, 'd': 1, 'j': 2, 'l': 3 };
    const lane = keys[e.key.toLowerCase()];

    if (lane !== undefined && isPlaying) {
        const now = bgm.currentTime;
        const note = activeNotes.find(n => n.lane === lane && !n.hit);

        if (note) {
            const result = judgeNote(note, now);

            if (result === 'PERFECT') {
                note.hit = true;
                note.el.style.display = "none";
                combo++;
                score += 150;
                perfect++;
                scoreEl.innerText = score.toString().padStart(6, '0');
                comboEl.innerText = combo;
                judgeEl.innerText = "PERFECT";
                judgeEl.style.color = "#fff";
            } else if (result === 'SUCCESS') {
                note.hit = true;
                note.el.style.display = "none";
                combo++;
                score += 100;
                success++;
                scoreEl.innerText = score.toString().padStart(6, '0');
                comboEl.innerText = combo;
                judgeEl.innerText = "SUCCESS";
                judgeEl.style.color = "#fff";
            } else if (result === 'GREAT') {
                note.hit = true;
                note.el.style.display = "none";
                combo++;
                score += 50;
                great++;
                scoreEl.innerText = score.toString().padStart(6, '0');
                comboEl.innerText = combo;
                judgeEl.innerText = "GREAT";
                judgeEl.style.color = "#fff";
            } else if (result === 'MISS') {
                note.hit = true;
                combo = 0;
                comboEl.innerText = "";
                judgeEl.innerText = "MISS";
                miss++;
                judgeEl.style.color = "#888";
            }

            if ((result === 'PERFECT' || result === 'SUCCESS' || result === 'GREAT') && currentMode === 'ボス猫の手下') {
                flash.style.opacity = 0.4;
                setTimeout(() => flash.style.opacity = 0, 40);
            }
        }
    }
    createWave();
});
