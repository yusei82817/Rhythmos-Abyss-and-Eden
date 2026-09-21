import { judgeNote } from './judgment.js?v=2';

const bgm = document.getElementById('bgm');
const selectScreen = document.getElementById('select-screen');
const playScreen = document.getElementById('play-screen');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo-num');
const judgeEl = document.getElementById('judge-text');
const timerEl = document.getElementById('song-timer');
const messageEl = document.getElementById('game-message');

let score = 0;
let combo = 0;
let perfect = 0;
let success = 0;
let great = 0;
let superCount = 0;
let good = 0;
let bene = 0;
let miss = 0;
let isPlaying = false;
let activeNotes = [];
let chart = [];
let animationFrame = 0;
const noteSpeed = 500;
const judgmentY = 510;

document.getElementById('top-button')?.addEventListener('click', () => {
    location.href = 'title.html';
});

window.initGame = async function initGame(src, mode) {
    if (!src) return;

    resetGameState();
    selectScreen.style.display = 'none';
    playScreen.style.display = 'block';
    messageEl.textContent = '';

    bgm.src = src;
    await loadChart(src);

    isPlaying = true;
    try {
        await bgm.play();
        animationFrame = requestAnimationFrame(update);
    } catch (error) {
        isPlaying = false;
        messageEl.textContent = '音源を再生できません。もう一度曲カードを押してください。';
        console.error('Halloween BGM playback failed:', error);
    }
};

function resetGameState() {
    cancelAnimationFrame(animationFrame);
    activeNotes.forEach(note => note.el.remove());
    activeNotes = [];
    chart = [];
    score = 0;
    combo = 0;
    perfect = 0;
    success = 0;
    great = 0;
    superCount = 0;
    good = 0;
    bene = 0;
    miss = 0;
    isPlaying = false;
    scoreEl.textContent = '000000';
    comboEl.textContent = '';
    judgeEl.textContent = '';
    judgeEl.className = 'judgment-clones';
    judgeEl.dataset.judgment = '';
    timerEl.textContent = '00:00.00';
}

async function loadChart(src) {
    const audioName = decodeURIComponent(src.split('/').pop() || '');
    const chartName = audioName.replace(/\.[^.]+$/, '');
    const chartPaths = [
        `chart/hwc/${encodeURIComponent(chartName)}.json`,
        `chart/hwc/${encodeURIComponent(chartName + ' ')}.json`
    ];

    try {
        let response = await fetch(chartPaths[0]);

        // 旧形式の「曲名 + 半角スペース + .json」も救済する
        if (!response.ok && response.status === 404) {
            response = await fetch(chartPaths[1]);
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const offset = Number(data.offset) || 0;

        chart = Array.isArray(data.notes)
            ? data.notes
                .map(note => ({
                    time: Number(note.time) + offset,
                    lane: Math.max(0, Math.min(3, Number(note.lane) | 0)),
                    type: note.type || 'normal'
                }))
                .filter(note => Number.isFinite(note.time) && note.time >= 0)
                .sort((a, b) => a.time - b.time)
            : [];

        messageEl.textContent = '';
    } catch (error) {
        console.warn('Halloween fixed chart unavailable, using generated fallback:', error);
        generateFallbackChart();
    }
}

function generateFallbackChart() {
    chart = [];
    const bpm = 128;
    const beat = 60 / bpm;
    for (let i = 0; i < 260; i++) {
        const time = 1.5 + i * beat * 0.5;
        chart.push({
            time,
            lane: Math.floor(Math.random() * 4),
            type: 'normal'
        });
    }
    messageEl.textContent = '譜面データ未登録: 仮譜面でプレイ中';
}

function update() {
    if (!isPlaying) return;

    const now = bgm.currentTime;
    updateTimer();

    while (chart.length && chart[0].time <= now + 1.2) {
        const data = chart.shift();
        const laneEl = document.getElementById(`lane-${data.lane}`);
        if (!laneEl) continue;

        const el = document.createElement('div');
        el.className = 'note';
        laneEl.appendChild(el);

        activeNotes.push({
            el,
            lane: data.lane,
            targetTime: data.time,
            hit: false
        });
    }

    for (let i = activeNotes.length - 1; i >= 0; i--) {
        const note = activeNotes[i];
        const diff = note.targetTime - now;
        note.el.style.top = `${judgmentY - diff * noteSpeed}px`;

        if (diff < -0.15 && !note.hit) {
            note.hit = true;
            combo = 0;
            miss++;
            showJudgment('MISS');
        }

        if (diff < -0.3) {
            note.el.remove();
            activeNotes.splice(i, 1);
        }
    }

    animationFrame = requestAnimationFrame(update);
}

function updateTimer() {
    const time = bgm.currentTime || 0;
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const hundredths = Math.floor((time % 1) * 100);
    timerEl.textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

function showJudgment(result) {
    judgeEl.dataset.judgment = result;

    const clone = document.createElement('span');
    clone.className = `judgment-clone judgment-${result.toLowerCase()}`;
    clone.textContent = result;

    // 判定文字を画面全域へ散開させ、端からはみ出す個体も許可する。
    // 連続判定でも既存クローンを消さず、各演出を最後まで見せる。
    const x = -10 + Math.random() * 120;
    const y = -10 + Math.random() * 120;
    clone.style.left = `${x}%`;
    clone.style.top = `${y}%`;
    clone.style.setProperty('--clone-rotate', `${(Math.random() * 60 - 30).toFixed(1)}deg`);

    judgeEl.appendChild(clone);

    const maxClones = 24;
    while (judgeEl.children.length > maxClones) {
        judgeEl.firstElementChild?.remove();
    }

    clone.addEventListener('animationend', () => clone.remove(), { once: true });

    comboEl.textContent = combo || '';
    scoreEl.textContent = String(score).padStart(6, '0');
}

window.addEventListener('keydown', event => {
    if (!isPlaying || event.repeat) return;

    const keys = { a: 0, s: 1, k: 2, l: 3 };
    const lane = keys[event.key.toLowerCase()];
    if (lane === undefined) return;

    const now = bgm.currentTime;
    const note = activeNotes
        .filter(item => item.lane === lane && !item.hit)
        .sort((a, b) => Math.abs(a.targetTime - now) - Math.abs(b.targetTime - now))[0];

    if (!note) return;

    const result = judgeNote(note, now);
    if (!result) return;

    note.hit = true;

    if (result === 'PERFECT') {
        perfect++;
        combo++;
        score += 150;
    } else if (result === 'SUCCESS') {
        success++;
        combo++;
        score += 100;
    } else if (result === 'GREAT') {
        great++;
        combo++;
        score += 50;
    } else if (result === 'SUPER') {
        superCount++;
        combo++;
        score += 40;
    } else if (result === 'GOOD') {
        good++;
        combo++;
        score += 30;
    } else if (result === 'BENE') {
        bene++;
        combo++;
        score += 20;
    } else {
        miss++;
        combo = 0;
    }

    note.el.remove();
    showJudgment(result);
});

bgm.addEventListener('ended', finishGame);

function finishGame() {
    if (!isPlaying) return;
    isPlaying = false;
    cancelAnimationFrame(animationFrame);

    activeNotes.forEach(note => note.el.remove());
    activeNotes = [];

    localStorage.setItem('score', String(score));
    localStorage.setItem('perfect', String(perfect));
    localStorage.setItem('success', String(success));
    localStorage.setItem('great', String(great));
    localStorage.setItem('super', String(superCount));
    localStorage.setItem('good', String(good));
    localStorage.setItem('bene', String(bene));
    localStorage.setItem('miss', String(miss));

    location.href = 'hwresult.html';
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden && isPlaying) bgm.pause();
});

window.addEventListener('focus', () => {
    if (isPlaying && bgm.paused) bgm.play().catch(() => {});
});
