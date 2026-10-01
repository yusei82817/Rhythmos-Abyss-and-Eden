const HD_NOTE_SPEED = 0.00032;
const HD_HIT_WINDOW = 140;
const HD_MISS_WINDOW = 180;
const HD_SPAWN_LEAD = 1800;

async function loadHDNotePattern(stageId) {
  const response = await fetch('note-pattern.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`note-pattern.json: ${response.status}`);
  const data = await response.json();
  return data[stageId]?.notes || [];
}

function createHDNote(note, laneEl) {
  const el = document.createElement('div');
  el.className = `note${note.type === 'space' ? ' space-note' : ''}`;
  el.dataset.lane = String(note.lane);
  el.dataset.type = note.type || 'normal';
  el.dataset.time = String(note.time);
  el.dataset.hit = '0';
  laneEl.appendChild(el);
  return el;
}

function generateMathNotes(duration = 30000, interval = 250) {
  const notes = [];
  const count = Math.floor(duration / interval);

  for (let i = 0; i < count; i++) {
    const t = i * 0.13;
    const raw = Math.tan(t);
    const normalized = Math.atan(raw) / Math.PI + 0.5;
    const lane = Math.max(0, Math.min(6, Math.round(normalized * 6)));
    const type = lane === 3 ? 'space' : 'normal';

    notes.push({
      time: i * interval + 1000,
      lane,
      type
    });
  }

  return notes;
}

function startHDNotes({ stageId, lanes, onHit, onMiss, onEnd }) {
  let notes = generateMathNotes();
  let startTime = performance.now();
  let raf = 0;
  let finished = false;

  function frame(now) {
    if (finished) return;

    const elapsed = now - startTime;

    for (const note of notes) {
      if (!note.spawned && elapsed >= note.time - HD_SPAWN_LEAD) {
        const lane = lanes[note.lane];
        if (lane) note.element = createHDNote(note, lane);
        note.spawned = true;
      }

      if (note.element && note.element.dataset.hit === '0') {
        const untilHit = note.time - elapsed;
        const progress = 1 - (untilHit + HD_SPAWN_LEAD) / HD_SPAWN_LEAD;
        const clamped = Math.max(0, Math.min(1, progress));
        const lane = note.element.parentElement;
        const travel = Math.max(0, (lane?.clientHeight || 400) - 72);
        note.element.style.transform = `translateY(${clamped * travel}px)`;

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
    if (startTime === null) return false;
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
