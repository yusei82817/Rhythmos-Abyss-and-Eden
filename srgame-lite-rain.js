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

/* 「母なる海へ」専用。CSSアニメーションだけで窓ガラスを伝う水滴を表現する。 */
let rainOverlay = null;

function setupRainEffect() {
    if (rainOverlay) return;

    const style = document.createElement('style');
    style.id = 'mother-sea-rain-style';
    style.textContent = `
        #mother-sea-rain {
            position:absolute;
            inset:0;
            z-index:12;
            pointer-events:none;
            overflow:hidden;
            opacity:0;
            transition:opacity 1.2s ease;
        }
        #mother-sea-rain.active { opacity:1; }
        .mother-sea-drop {
            position:absolute;
            top:-30px;
            width:var(--drop-size);
            height:calc(var(--drop-size) * 1.25);
            border-radius:50% 50% 58% 42%;
            background:radial-gradient(circle at 35% 25%,rgba(255,255,255,.85) 0 8%,rgba(220,245,255,.48) 25%,rgba(140,210,235,.18) 62%,transparent 100%);
            box-shadow:0 0 5px rgba(190,235,255,.28);
            opacity:.55;
            transform:translate3d(0,0,0);
            will-change:transform,opacity;
            animation:motherSeaFlow var(--drop-duration) linear infinite;
            animation-delay:var(--drop-delay);
        }
        .mother-sea-drop::after {
            content:"";
            position:absolute;
            left:50%;
            top:55%;
            width:55%;
            height:var(--trail-length);
            transform:translateX(-50%);
            border-radius:50%;
            background:linear-gradient(to bottom,rgba(205,240,255,.18),rgba(150,215,235,.06),transparent);
        }
        @keyframes motherSeaFlow {
            0%   { transform:translate3d(0,-40px,0); opacity:0; }
            8%   { opacity:.55; }
            35%  { transform:translate3d(var(--drift-a),190px,0); }
            68%  { transform:translate3d(var(--drift-b),410px,0); opacity:.48; }
            94%  { transform:translate3d(var(--drift-c),650px,0); opacity:.12; }
            100% { transform:translate3d(var(--drift-c),690px,0); opacity:0; }
        }
    `;
    document.head.appendChild(style);

    rainOverlay = document.createElement('div');
    rainOverlay.id = 'mother-sea-rain';
    container.appendChild(rainOverlay);

    /* 少数の固定DOMだけを作り、重い毎フレームJS処理を避ける。 */
    const drops = [
        [9,6,8,'4.8s','-1.9s','-8px','7px','-3px','38px'],
        [21,4,5,'5.6s','-3.2s','4px','-6px','2px','28px'],
        [34,7,9,'6.4s','-4.7s','-5px','9px','-2px','46px'],
        [48,5,6,'5.1s','-2.1s','6px','-4px','3px','32px'],
        [61,8,10,'6.9s','-5.3s','-6px','8px','-4px','50px'],
        [74,5,7,'5.8s','-3.8s','3px','-7px','2px','35px'],
        [86,6,5,'6.2s','-4.1s','-4px','6px','-2px','27px'],
        [94,4,8,'7.1s','-6.0s','5px','-5px','3px','42px']
    ];

    for (const [left,size,duration,delay,_,a,b,c,trail] of drops) {
        const drop = document.createElement('div');
        drop.className = 'mother-sea-drop';
        drop.style.left = `${left}%`;
        drop.style.setProperty('--drop-size', `${size}px`);
        drop.style.setProperty('--drop-duration', duration);
        drop.style.setProperty('--drop-delay', delay);
        drop.style.setProperty('--drift-a', a);
        drop.style.setProperty('--drift-b', b);
        drop.style.setProperty('--drift-c', c);
        drop.style.setProperty('--trail-length', trail);
        rainOverlay.appendChild(drop);
    }
}

function startRainDrops() {
    setupRainEffect();
    rainOverlay.classList.add('active');
}

function stopRainDrops() {
    if (!rainOverlay) return;
    rainOverlay.classList.remove('active');
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

    if (mode === '母なる海へ') {
        startRainDrops();
    } else {
        stopRainDrops();
    }

    const selectScreen = document.getElementById('select-screen');
    if (selectScreen) selectScreen.style.display = 'none';

    const chartPromise = loadChart(src);

    try {
        await bgm.play();
        isPlaying = true;
        requestAnimationFrame(update);
        await chartPromise;
    } catch (err) {
        console.error('BGMの再生に失敗しました。', err);
        isPlaying = false;
    }
}

window.initGame = initGame;

async function loadChart(src) {
    const audioName = decodeURIComponent(src.split('/').pop() || '');
    const chartName = audioName.replace(/\.[^.]+$/, '');
    const chartPath = `chart/surpass/${encodeURIComponent(chartName)}.json`;

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
                lane: Math.floor(Math.random() * 8),
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
    stopRainDrops();
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

    location.href = "srresult.html";
});

window.addEventListener('keydown', (e) => {
    const keys = {
        'a': 0,
        's': 1,
        'd': 2,
        'f': 3,
        'j': 4,
        'k': 5,
        'l': 6,
        ';': 7
    };
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
