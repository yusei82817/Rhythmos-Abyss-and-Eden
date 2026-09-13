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

/*
 * 「母なる海へ」専用の窓ガラス風水滴エフェクト。
 * 雨粒が真下へ落ちるのではなく、ガラス面をゆっくり伝うように動かす。
 */
let rainOverlay = null;
let rainDrops = [];
let rainFrame = null;
let rainLastTime = 0;

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
            transition:opacity 1.4s ease;
        }
        #mother-sea-rain.active {
            opacity:1;
        }
        .mother-sea-drop {
            position:absolute;
            left:0;
            top:0;
            width:var(--drop-size);
            height:var(--drop-size);
            border-radius:50% 50% 58% 42%;
            background:radial-gradient(circle at 35% 28%, rgba(255,255,255,.95) 0 9%, rgba(220,245,255,.78) 22%, rgba(150,215,235,.34) 58%, rgba(110,190,220,.08) 100%);
            box-shadow:0 0 7px rgba(190,235,255,.5), inset -2px -2px 4px rgba(50,120,160,.18);
            filter:blur(.15px);
            transform:translate(-50%,-50%);
        }
        .mother-sea-drop::after {
            content:"";
            position:absolute;
            left:50%;
            top:calc(var(--drop-size) * .45);
            width:calc(var(--drop-size) * .7);
            height:var(--trail-length);
            transform:translateX(-50%);
            border-radius:50%;
            background:linear-gradient(to bottom, rgba(205,240,255,.24), rgba(150,215,235,.09), transparent);
            filter:blur(1.2px);
        }
    `;
    document.head.appendChild(style);

    rainOverlay = document.createElement('div');
    rainOverlay.id = 'mother-sea-rain';
    container.appendChild(rainOverlay);
}

function clearRainDrops() {
    rainDrops.forEach(drop => drop.el.remove());
    rainDrops = [];
}

function createRainDrop(startAtTop = true) {
    if (!rainOverlay) return;

    const el = document.createElement('div');
    el.className = 'mother-sea-drop';

    const size = 3 + Math.random() * 7;
    const startX = 5 + Math.random() * 90;
    const startY = startAtTop ? -8 - Math.random() * 80 : Math.random() * 100;
    const trail = 12 + Math.random() * 42;

    el.style.setProperty('--drop-size', `${size}px`);
    el.style.setProperty('--trail-length', `${trail}px`);
    rainOverlay.appendChild(el);

    rainDrops.push({
        el,
        x: startX,
        y: startY,
        baseX: startX,
        progress: startAtTop ? 0 : Math.random(),
        speed: 0.018 + Math.random() * 0.026,
        sway: (Math.random() - 0.5) * 3.2,
        phase: Math.random() * Math.PI * 2,
        pause: Math.random() * 0.5,
        size,
        life: 1
    });
}

function startRainDrops() {
    setupRainEffect();
    clearRainDrops();
    rainOverlay.classList.add('active');

    const count = 18;
    for (let i = 0; i < count; i++) createRainDrop(false);
    for (let i = 0; i < 7; i++) createRainDrop(true);

    if (!rainFrame) {
        rainLastTime = performance.now();
        rainFrame = requestAnimationFrame(updateRainDrops);
    }
}

function stopRainDrops() {
    if (!rainOverlay) return;
    rainOverlay.classList.remove('active');
    clearRainDrops();
}

function updateRainDrops(timestamp) {
    const dt = Math.min(32, timestamp - rainLastTime);
    rainLastTime = timestamp;

    if (rainOverlay && rainOverlay.classList.contains('active')) {
        for (let i = rainDrops.length - 1; i >= 0; i--) {
            const drop = rainDrops[i];
            if (drop.pause > 0) {
                drop.pause -= dt / 1000;
            } else {
                drop.progress += drop.speed * (dt / 16.67);
            }

            const t = drop.progress;
            drop.y = -5 + t * 112;
            const curve = Math.sin(t * Math.PI * 2.2 + drop.phase) * drop.sway;
            const drift = Math.sin(t * Math.PI * 5 + drop.phase) * 0.7;
            drop.x = drop.baseX + curve + drift;

            const width = container.clientWidth || 640;
            const height = container.clientHeight || 600;
            drop.el.style.left = `${(drop.x / 100) * width}px`;
            drop.el.style.top = `${(drop.y / 100) * height}px`;

            const stretch = 1 + Math.min(0.9, Math.abs(drop.speed) * 18);
            drop.el.style.transform = `translate(-50%,-50%) scale(1,${stretch})`;
            drop.el.style.opacity = t < 0.08 ? t / 0.08 : (t > 0.9 ? (1 - t) / 0.1 : 0.5 + Math.sin(t * 18 + drop.phase) * 0.12);

            if (t > 1.05) {
                drop.el.remove();
                rainDrops.splice(i, 1);
                createRainDrop(true);
            }
        }
    }

    rainFrame = requestAnimationFrame(updateRainDrops);
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

    // 譜面読み込みを音声再生と並行して開始する。
    // awaitでユーザー操作の再生許可を失わないようにする。
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
