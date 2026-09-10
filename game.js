// ==========================================
// 1. 要素（DOM）の取得
// ==========================================
const glitch = document.getElementById("glitch");
const bgm = document.getElementById('bgm');
const container = document.getElementById('game-container');
const gameBg = document.getElementById('game-bg');
const flash = document.getElementById('flash-overlay');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo-num');
const judgeEl = document.getElementById('judge-text');

// ==========================================
// 2. ゲームの状態・変数
// ==========================================
let score = 0;
let combo = 0;
let perfect = 0;
let great = 0;
let miss = 0;
let isPlaying = false;
let activeNotes = [];
let chart = [];
let currentMode = '';
let noteSpeed = 500;
let judgmentY = 520;

// ==========================================
// 3. エフェクト・演出処理
// ==========================================
function glitchEffect() {
    glitch.classList.add("glitch-on");
    setTimeout(() => {
        glitch.classList.remove("glitch-on");
    }, 150);
}

// 5秒ごとに低確率でグリッチエフェクトを発動
setInterval(() => {
    if (Math.random() < 0.15) {
        glitchEffect();
    }
}, 5000);

function createWave() {
    const wave = document.createElement("div");
    wave.className = "wave-effect";
    wave.style.left = "50%";
    wave.style.top = "80%";
    
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
        gameContainer.appendChild(wave);
    }
    setTimeout(() => {
        wave.remove();
    }, 500);
}

// ==========================================
// 4. ゲームコアシステム（初期化・生成・ループ）
// ==========================================
function initGame(src, mode, bgImage = '') {
    if (!src || !mode) {
        console.error('エラー: src または mode が指定されていません。');
        return;
    }

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
    if (selectScreen) {
        selectScreen.style.display = 'none';
    }

    generateChart(mode);
    isPlaying = true;

    bgm.play()
        .then(() => {
            requestAnimationFrame(update);
        })
        .catch(err => {
            console.error('BGMの再生に失敗しました。ユーザーの操作が必要です:', err);
        });
}

function generateChart(mode) {
    chart = [];
    const endSeconds = 150;
    const bpm = (mode === 'ボス猫の手下') ? 160 : 120;
    const secPerBeat = 60 / bpm;

    // ここで毎回ランダムに譜面を作っています！
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

    while (chart.length > 0 && chart[0].time <= now + 1.2) {
        const data = chart.shift();
        const el = document.createElement('div');
        el.className = 'note';

        const laneEl = document.getElementById(`lane-${data.lane}`);
        if (laneEl) {
            laneEl.appendChild(el);
        }

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

        // ボス猫の手下モード限定：ノーツが近づくとステルス（透明）になる
        if (currentMode === 'ボス猫の手下' && diff < 0.25) {
            n.el.style.opacity = Math.max(0, diff * 4);
        }

        // 見逃しMISS判定
        if (diff < -0.15 && !n.hit) {
            n.hit = true;
            combo = 0;
            comboEl.innerText = "";
            judgeEl.innerText = "MISS";
            miss++;
            judgeEl.style.color = "#888";
        }

        // 画面外に出たノーツの削除
        if (diff < -0.3) {
            n.el.remove();
            activeNotes.splice(i, 1);
        }
    }
    requestAnimationFrame(update);
}

// ==========================================
// 5. イベントリスナー（キー入力・曲終了）
// ==========================================
bgm.addEventListener('ended', () => {
    isPlaying = false;
    activeNotes.forEach(note => {
        note.el.remove();
    });
    activeNotes = [];

    // スコアの保存
    localStorage.setItem("score", score);
    localStorage.setItem("perfect", perfect);
    localStorage.setItem("great", great);
    localStorage.setItem("miss", miss);

    // リセット
    score = 0;
    combo = 0;
    scoreEl.innerText = "000000";
    comboEl.innerText = "";
    judgeEl.innerText = "";

    // リザルト画面へ遷移
    if (location.pathname.toLowerCase().endsWith('gfgame.html')) {
        location.href = "gfresult.html";
    } else {
        location.href = "spresult.html";
    }
});

window.addEventListener('keydown', (e) => {
    const keys = { 'f': 0, 'g': 1, 'j': 2, 'k': 3 };
    const lane = keys[e.key.toLowerCase()];

    if (lane !== undefined && isPlaying) {
        const now = bgm.currentTime;
        const note = activeNotes.find(n => n.lane === lane && !n.hit);

        if (note) {
            const diff = Math.abs(note.targetTime - now);
            if (diff < 0.1) {
                note.hit = true;
                note.el.style.display = "none";
                combo++;
                score += 100;
                scoreEl.innerText = score.toString().padStart(6, '0');
                comboEl.innerText = combo;

                if (diff < 0.05) {
                    perfect++;
                    judgeEl.innerText = "PERFECT";
                } else {
                    great++;
                    judgeEl.innerText = "GREAT";
                }
                judgeEl.style.color = "#fff";

                // ボス猫の手下モード限定：画面フラッシュ
                if (currentMode === 'ボス猫の手下') {
                    flash.style.opacity = 0.4;
                    setTimeout(() => {
                        flash.style.opacity = 0;
                    }, 40);
                }
            }
        }
    }
    createWave();
});
