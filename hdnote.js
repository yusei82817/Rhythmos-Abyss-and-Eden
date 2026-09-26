const HD_NOTE_SPEED = 0.00032;
const HD_HIT_WINDOW = 140;
const HD_MISS_WINDOW = 180;

async function loadHDNotePattern(stageId) {
  const response = await fetch('note-pattern.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`note-pattern.json: ${response.status}`);
  const data = await response.json();
  return data[stageId]?.notes || [];
}

function createHDNote(note, laneEl) {
  const el = document.createElement('div');
  el.className = 'note';
  el.dataset.lane = String(note.lane);
  el.dataset.time = String(note.time);
  el.dataset.hit = '0';
  laneEl.appendChild(el);
  return el;
}

function startHDNotes({ stageId, lanes, onHit, onMiss, onEnd }) {
  let notes = [];
  let startTime = performance.now();
  let raf = 0;
  let loaded = false;
  let finished = false;

  loadHDNotePattern(stageId).then(pattern => {
    notes = pattern.map(note => ({ ...note, element: null, spawned: false }));
    loaded = true;
  }).catch(error => {
    console.error(error);
    onEnd?.(error);
  });

  function frame(now) {
    if (!loaded || finished) {
      if (!finished) raf = requestAnimationFrame(frame);
      return;
    }

    const elapsed = now - startTime;
    const spawnLead = 1800;

    for (const note of notes) {
      if (!note.spawned && elapsed >= note.time - spawnLead) {
        const lane = lanes[note.lane];
        if (lane) note.element = createHDNote(note, lane);
        note.spawned = true;
      }

      if (note.element && note.element.dataset.hit === '0') {
        const untilHit = note.time - elapsed;
        const progress = 1 - (untilHit + spawnLead) / spawnLead;
        const clamped = Math.max(0, Math.min(1, progress));
        note.element.style.transform = `translateY(${clamped * 100}%)`;

        if (elapsed > note.time + HD_MISS_WINDOW) {
          note.element.dataset.hit = '1';
          note.element.remove();
          onMiss?.(note);
        }
      }
    }

    if (notes.length && elapsed > Math.max(...notes.map(n => n.time)) + HD_MISS_WINDOW + 500) {
      finished = true;
      onEnd?.();
      return;
    }

    raf = requestAnimationFrame(frame);
  }

  function hitLane(lane) {
    const now = performance.now() - startTime;
    let target = null;
    let best = Infinity;

    for (const note of notes) {
      if (!note.spawned || note.lane !== lane || !note.element || note.element.dataset.hit !== '0') continue;
      const delta = Math.abs(now - note.time);
      if (delta <= HD_HIT_WINDOW && delta < best) {
        best = delta;
        target = note;
      }
    }

    if (!target) return false;
    target.element.dataset.hit = '1';
    target.element.remove();
    onHit?.(target, best);
    return true;
  }

  function stop() {
    finished = true;
    cancelAnimationFrame(raf);
    notes.forEach(note => note.element?.remove());
  }

  raf = requestAnimationFrame(frame);
  return { hitLane, stop };
}
