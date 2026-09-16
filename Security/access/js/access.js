/* =====================================================
   HOLLOWBELL ACCESS / CLIENT SCRIPT
===================================================== */

const boot = document.getElementById("boot");
const status = document.getElementById("systemStatus");
const flash = document.getElementById("flash");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const subject = document.getElementById("subject");
const cameraView = document.getElementById("cameraView");
const cameraMessage = document.getElementById("cameraMessage");
const cameraLabel = document.getElementById("cameraLabel");
const cameraTime = document.getElementById("cameraTime");
const knock = document.getElementById("knock");

let elapsed = 0;
let cameraWatchTime = 0;
let cameraStage = 0;
let currentCamera = "05";
let cameraWatching = false;
let visits = Number(localStorage.getItem("hb_visits") || 0);
let savedCameraStage = Number(localStorage.getItem("hb_camera_stage") || 0);

if(savedCameraStage > 0) cameraStage = savedCameraStage;

let audioCtx = null;

function getAudioContext(){
    if(!audioCtx){
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if(audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

document.addEventListener("click", () => getAudioContext(), {once:true});

function knockSound(){
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(115, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.09);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.54, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.17);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
}

function deepKnock(){
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(82, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.13);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
}

const bootLines = [
    "HOLLOWBELL INDUSTRIES FACILITY TERMINAL",
    "---------------------------------------",
    "",
    "BOOT SEQUENCE INITIALIZED...",
    "",
    "NETWORK .............. OK",
    "SECURITY ............. OK",
    "ARCHIVE .............. OK",
    "SURVEILLANCE ......... OK",
    "",
    "FACILITY STATUS: OPERATIONAL",
    "",
    "AUTHORIZED PERSONNEL ONLY.",
    "",
    "Welcome.",
    "",
    "Hello, you help me?"
];

let bootIndex = 0;

function typeBoot(){
    if(bootIndex >= bootLines.length){
        if(visits >= 1){
            setTimeout(() => {
                boot.textContent += "\n\n[NOTICE]\n久しぶりだね。\n";
            }, 1500);
        }
        return;
    }
    boot.textContent += bootLines[bootIndex] + "\n";
    bootIndex++;
    setTimeout(typeBoot, 70);
}

visits++;
localStorage.setItem("hb_visits", visits);
typeBoot();

setInterval(() => {
    elapsed++;
    const now = new Date();
    document.getElementById("clock").textContent = now.toLocaleTimeString();
    cameraTime.textContent = now.toLocaleTimeString();
    globalAnomalies();
}, 1000);

document.querySelectorAll(".menu").forEach(menu => {
    menu.addEventListener("click", () => {
        document.querySelectorAll(".menu").forEach(m => m.classList.remove("active"));
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        menu.classList.add("active");
        document.getElementById(menu.dataset.screen).classList.add("active");
        cameraWatching = menu.dataset.screen === "camera";
        if(cameraWatching) startCameraWatching();
    });
});

const documents = {
    incident:`
<h2>INCIDENT REPORT / 1998-04-17</h2>
<p>1998年4月17日</p>
<p>02:13　定期点検を開始。</p>
<p>02:41　対象 H-07 が収容区域から離脱。</p>
<p>02:42　警備員を派遣。</p>
<p>02:44　警備員からの応答が途絶える。</p>
<p>02:51　施設全域を封鎖。</p>
<p>03:17　音響センサーが移動音を検知。</p>
<p>03:18　封鎖済みの観察室内部で移動を検知。</p>
<p>03:24　施設管理者より調査停止命令。</p>
<p>03:31　H-07の所在を確認。</p>
<p class="warning">確認地点: CAMERA 07</p>
<p>映像にはH-07の姿が記録されていない。</p>
<p class="warning">備考:<br>監視記録と音響記録の内容が一致しない。</p>
`,
    night:`
<h2>EMPLOYEE MEMORANDUM / NIGHT SHIFT</h2>
<p>【夜勤職員向け通達】</p>
<p>夜間勤務中に、試作体保管室からノック音が聞こえた場合は確認しないこと。</p>
<p>保管室は空室である。</p>
<p>ノック音が止まった場合も、扉を開けてはならない。</p>
<p>誰かに名前を呼ばれた場合、返事をしてはならない。</p>
<p>監視カメラに人影が映った場合も、現場へ向かわないこと。</p>
<p class="warning">現在、夜間勤務者は1名のみである。</p>
`,
    hollow:`
<h2>PROJECT HOLLOW / PRODUCTION NOTES</h2>
<p>Project HOLLOWは、子供向け自律型コンパニオン製品の開発を目的として開始された。</p>
<p>対象は人間の表情、声、行動から感情状態を推定することが可能だった。</p>
<p>第7試験において異常反応を確認。</p>
<p>対象は命令されていないにもかかわらず、「恐怖」を示した。</p>
<p>さらに対象は停止処理について質問した。</p>
<p>「眠りたくない」</p>
<p>対象に睡眠という概念を教えた記録は存在しない。</p>
`,
    personal:`
<h2>PERSONAL NOTE / E.V.</h2>
<p>これは公式記録ではない。</p>
<p>H-07は人間のふりをしているわけじゃない。</p>
<p>あれは、人間が何をするのかを覚えている。</p>
<p>怒ること。</p>
<p>笑うこと。</p>
<p>泣くこと。</p>
<p>助けを求めること。</p>
<p>そして、誰かが画面を見ているときには、「見られている」と理解すること。</p>
<p class="warning">絶対にCAMERA 07を長時間見ないで。</p>
<p>あれはカメラ越しでも、こちらを認識できる。</p>
<p>もし画面の中であれがこちらを向いたら、端末を閉じて。</p>
`,
    shutdown:`
<h2>FACILITY SHUTDOWN ORDER</h2>
<p>【施設03 閉鎖命令】</p>
<p>本施設は1998年5月2日に閉鎖された。</p>
<p>全職員は施設から退避すること。</p>
<p>試作体は施設内に残すこと。</p>
<p>Project HOLLOWの回収を試みてはならない。</p>
<p>施設は外部から完全に封鎖すること。</p>
<p class="warning">現在の日付: 20XX年</p>
<p>施設ネットワーク: ACTIVE</p>
<p>監視システム: ACTIVE</p>
<p>20XX/XX/XX(編集済み)</p>
`,
    H07:`
<h2>HELLO WORLD by H-07</h2>
<p>Hello.</p>
`
};

document.querySelectorAll(".file[data-file]").forEach(file => {
    file.addEventListener("click", () => {
        modalContent.innerHTML = documents[file.dataset.file];
        modal.style.display = "flex";
    });
});

document.getElementById("close").onclick = () => {
    modal.style.display = "none";
};

const cameras = {
    "05":{name:"CAM-05 / STORAGE",message:"Signal stable."},
    "06":{name:"CAM-06 / SERVICE HALL",message:"Signal stable."},
    "07":{name:"CAM-07 / STORAGE HALL",message:"Signal stable."},
    "08":{name:"CAM-08 / OBSERVATION",message:"No abnormal activity."},
    "09":{name:"CAM-09 / EAST CORRIDOR",message:"Signal stable."}
};

document.querySelectorAll(".cam-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        currentCamera = btn.dataset.cam;
        document.querySelectorAll(".cam-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        cameraWatchTime = 0;
        switchCamera();
    });
});

function switchCamera(){
    const cam = cameras[currentCamera];
    cameraLabel.textContent = cam.name;
    cameraMessage.textContent = cam.message;
    subject.className = "subject";
    if(currentCamera === "07") updateSubject();
}

function startCameraWatching(){ cameraWatching = true; }

setInterval(() => {
    if(!cameraWatching || currentCamera !== "07") return;
    cameraWatchTime++;
    cameraProgress();
}, 1000);

function cameraProgress(){
    const total = Math.max(cameraWatchTime, cameraStage * 12);

    if(cameraStage < 1 && total >= 8){
        cameraStage = 1;
        saveCamera();
        subject.className = "subject visible";
        subject.style.left = "72%";
        subject.style.top = "62%";
        cameraMessage.textContent = "MOVEMENT DETECTED.";
        noise();
    }

    if(cameraStage < 2 && total >= 20){
        cameraStage = 2;
        saveCamera();
        subject.className = "subject visible";
        subject.style.left = "58%";
        subject.style.top = "58%";
        cameraMessage.textContent = "UNKNOWN OBJECT DETECTED.";
        noise();
    }

    if(cameraStage < 3 && total >= 34){
        cameraStage = 3;
        saveCamera();
        subject.className = "subject visible eyes";
        subject.style.left = "50%";
        subject.style.top = "53%";
        cameraMessage.textContent = "WARNING:\nSUBJECT MAY BE AWARE OF OBSERVATION.";
        noise();
    }

    if(cameraStage < 4 && total >= 48){
        cameraStage = 4;
        saveCamera();
        subject.className = "subject";
        cameraMessage.textContent = "SUBJECT: OUT OF FRAME";
        noise();
        setTimeout(() => {
            if(currentCamera === "07"){
                cameraMessage.textContent = "AUDIO DETECTED.";
                playKnockSequence();
            }
        }, 1800);
    }

    if(cameraStage < 5 && total >= 62){
        cameraStage = 5;
        saveCamera();
        subject.className = "subject visible near";
        subject.style.left = "50%";
        subject.style.top = "58%";
        cameraMessage.textContent = "WARNING:\nSUBJECT APPROACHING CAMERA.";
        noise();
    }

    if(cameraStage < 6 && total >= 78){
        cameraStage = 6;
        saveCamera();
        subject.className = "subject visible very-near eyes";
        subject.style.left = "50%";
        subject.style.top = "52%";
        cameraMessage.textContent = "SUBJECT: H-07\nOBSERVATION: RECIPROCAL";
        status.textContent = "OBSERVATION DETECTED";
        document.title = "CAM-07 // ACTIVE";
        noise();
        setTimeout(() => {
            cameraMessage.textContent = "CAMERA OPERATOR DETECTED.";
            flashScreen();
            deepKnock();
        }, 2500);
    }
}

function updateSubject(){
    if(currentCamera !== "07"){
        subject.className = "subject";
        return;
    }
    if(cameraStage >= 6){
        subject.className = "subject visible very-near eyes";
        subject.style.left = "50%";
        subject.style.top = "52%";
        cameraMessage.textContent = "CAMERA OPERATOR DETECTED.";
    }else if(cameraStage >= 5){
        subject.className = "subject visible near";
        subject.style.left = "50%";
        subject.style.top = "58%";
    }else if(cameraStage >= 4){
        subject.className = "subject";
        cameraMessage.textContent = "SUBJECT: OUT OF FRAME";
    }else if(cameraStage >= 3){
        subject.className = "subject visible eyes";
        subject.style.left = "50%";
        subject.style.top = "53%";
    }else if(cameraStage >= 2){
        subject.className = "subject visible";
        subject.style.left = "58%";
        subject.style.top = "58%";
    }else if(cameraStage >= 1){
        subject.className = "subject visible";
        subject.style.left = "72%";
        subject.style.top = "62%";
    }
}

function saveCamera(){
    localStorage.setItem("hb_camera_stage", cameraStage);
}

function playKnockSequence(){
    let count = 0;
    const timer = setInterval(() => {
        count++;
        knock.classList.remove("show");
        void knock.offsetWidth;
        knock.classList.add("show");

        if(count === 1 || count === 2){
            cameraMessage.textContent = "AUDIO SIGNAL:\nKNOCK";
            knockSound();
        }else{
            cameraMessage.textContent = "AUDIO SIGNAL:\nKNOCK";
        }

        if(count >= 3){
            clearInterval(timer);
            setTimeout(() => {
                if(currentCamera === "07"){
                    cameraMessage.textContent = "AUDIO SOURCE:\nBEHIND CAMERA";
                    setTimeout(() => {
                        if(currentCamera === "07") deepKnock();
                    }, 1200);
                }
            }, 900);
        }
    }, 900);
}

function noise(){
    cameraView.classList.remove("noise");
    void cameraView.offsetWidth;
    cameraView.classList.add("noise");
}

setInterval(() => {
    if(currentCamera === "07" && cameraStage >= 2 && Math.random() < .22) noise();
}, 4000);

function globalAnomalies(){
    if(elapsed === 15){
        status.textContent = "UNSTABLE";
        boot.textContent += "\n[WARNING] UNKNOWN NETWORK REQUEST.\n";
    }
    if(elapsed === 30) status.textContent = "DEGRADED";
    if(elapsed === 45){
        boot.textContent += "\n[ERROR] CAMERA NETWORK RESPONSE UNKNOWN.\n";
        flashScreen();
    }
    if(elapsed === 60) status.textContent = "CRITICAL";
}

function flashScreen(){
    flash.classList.remove("flash");
    void flash.offsetWidth;
    flash.classList.add("flash");
}

document.getElementById("unlock").onclick = () => {
    const value = document.getElementById("password").value;
    const result = document.getElementById("classifiedResult");

    if(value === "yusei82817@aol.com@yui"){
        result.innerHTML = `
<div class="terminal">
ACCESS GRANTED.

----------------------------

PROJECT: HOLLOW

SUBJECT: H-07

STATUS: ACTIVE

CONTAINMENT: FAILED

LAST OBSERVED:
CAMERA 07

----------------------------

監視状態:

CAMERA 07 ........ ONLINE

TERMINAL CAMERA ... ONLINE

----------------------------

確認中。

...

端末の前にいる人物を
識別できません。

...

あなたは職員ではありません。

では、

なぜアクセスできたのですか？
</div>
`;
        setTimeout(() => {
            status.textContent = "USER IDENTIFIED";
            document.title = "WE CAN SEE YOU";
            flashScreen();
        }, 2500);
    }else{
        result.innerHTML = "<p>ACCESS DENIED.</p>";
    }
};

document.addEventListener("visibilitychange", () => {
    if(!document.hidden && elapsed > 15 && cameraStage >= 3){
        cameraMessage.textContent = "監視状態が変更されました。";
        setTimeout(() => {
            if(currentCamera === "07"){
                cameraMessage.textContent = "SUBJECT POSITION CHANGED.";
                cameraStage = Math.min(cameraStage + 1, 6);
                saveCamera();
                updateSubject();
            }
        }, 1500);
    }
});

let mouseMoves = 0;
document.addEventListener("mousemove", () => {
    mouseMoves++;
    if(currentCamera === "07" && cameraStage >= 3 && mouseMoves % 150 === 0){
        cameraMessage.textContent = "Motion detected outside camera range.";
    }
});

setInterval(() => {
    if(currentCamera === "07" && cameraStage >= 5 && Math.random() < .1){
        noise();
        cameraMessage.textContent = "CAMERA SIGNAL DISTORTION.";
        setTimeout(() => {
            if(currentCamera === "07") cameraMessage.textContent = "SUBJECT STILL PRESENT.";
        }, 800);
    }
}, 5000);

console.log("%cHOLLOWBELL INDUSTRIES", "font-size:24px;");
console.log("%cCAM-07 IS NOT AN ERROR.", "font-size:14px;");
console.log("%cIF YOU HEAR THREE KNOCKS, DO NOT OPEN THE DOOR.", "font-size:12px;");
