const HD_HIT_WINDOW = 140;
const HD_MISS_WINDOW = 190; // Slight grace after the widened touch hit window.
const HD_SPAWN_LEAD = 1800;

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

// Build a fresh seven-lane chart on every play.
// The chart mixes rests, single notes, chords, short stairs and alternating lanes.
function generateRandomNotes(duration = 30000, beatInterval = 500) {
  const notes = [];
  let previousLane = -1;

  function addNote(time, lane) {
    notes.push({
      time,
      lane,
      type: lane === 3 ? 'space' : 'normal'
    });
    previousLane = lane;
  }

  function randomLane(exclude = -1) {
    let lane = Math.floor(Math.random() * 7);
    if (lane === exclude) lane = (lane + 1 + Math.floor(Math.random() * 6)) % 7;
    return lane;
  }

  const beats = Math.floor(duration / beatInterval);
  for (let beat = 0; beat < beats; beat++) {
    const baseTime = beat * beatInterval + 1000;
    const roll = Math.random();

    // Leave breathing room instead of filling every beat.
    if (roll < 0.16) continue;

    if (roll < 0.78) {
      addNote(baseTime, randomLane(previousLane));
      continue;
    }

    if (roll < 0.93) {
      const first = randomLane(previousLane);
      const second = randomLane(first);
      addNote(baseTime, first);
      addNote(baseTime, second);
      continue;
    }

    // A short three-note stair, randomly ascending or descending.
    const start = Math.floor(Math.random() * 5);
    const direction = Math.random() < 0.5 ? 1 : -1;
    const lanesInStair = direction === 1
      ? [start, start + 1, start + 2]
      : [start + 2, start + 1, start];
    lanesInStair.forEach((lane, index) => {
      addNote(baseTime + index * 145, lane);
    });
  }

  return notes.sort((a, b) => a.time - b.time);
}

function startHDNotes({ stageId, lanes, onHit, onMiss, onEnd }) {
  const notes = generateRandomNotes();
  const startTime = performance.now();
  let raf = 0;
  let finished = false;

  function frame(now) {
    if (finished) return;

    const elapsed = now - startTime;

    for (const note of notes) {
      if (!note.spawned && elapsed >= note.time - HD_SPAWN_LEAD) {
        const lane = lanes[note.lane];
        if (lane) {
          note.element = createHDNote(note, lane);
          note.element.style.transform = 'translateY(0px)';
        }
        note.spawned = true;
      }

      if (!note.element || note.element.dataset.hit !== '0') continue;

      const lane = note.element.parentElement;
      const travel = Math.max(0, (lane?.clientHeight || 400) - 72);
      const progress = Math.max(0, Math.min(1, (elapsed - (note.time - HD_SPAWN_LEAD)) / HD_SPAWN_LEAD));
      note.element.style.transform = `translate3d(0, ${progress * travel}px, 0)`;

      if (elapsed > note.time + HD_MISS_WINDOW) {
        note.element.dataset.hit = '1';
        note.element.remove();
        onMiss?.(note);
      }
    }

    if (notes.length && elapsed > notes[notes.length - 1].time + HD_MISS_WINDOW + 500) {
      finished = true;
      onEnd?.();
      return;
    }

    raf = requestAnimationFrame(frame);
  }

  function hitLane(lane, isTouch = false) {
    const hitWindow = isTouch ? HD_HIT_WINDOW * 1.3 : HD_HIT_WINDOW;
    const now = performance.now() - startTime;
    let target = null;
    let best = Infinity;

    for (const note of notes) {
      if (!note.spawned || note.lane !== lane || !note.element || note.element.dataset.hit !== '0') continue;
      const delta = Math.abs(now - note.time);
      if (delta <= hitWindow && delta < best) {
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
