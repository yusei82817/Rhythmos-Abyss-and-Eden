/*
 * Rhythmos Touch Input
 * Multi-touch lane input shared by Abyss, Eden, Surpass, Halloween and Heaven's Door.
 * Each game keeps its existing judgment logic; this module only translates a lane tap
 * into the same keyboard event that the original game already understands.
 */

const attachedRoots = new WeakSet();

function keyCodeFor(key) {
    if (key === 'Space') return 'Space';
    if (key.length === 1 && /[a-z]/i.test(key)) return `Key${key.toUpperCase()}`;
    if (key === ';') return 'Semicolon';
    return '';
}

function injectTouchStyles() {
    if (document.getElementById('rhythmos-touch-input-style')) return;

    const style = document.createElement('style');
    style.id = 'rhythmos-touch-input-style';
    style.textContent = `
        html, body {
            overscroll-behavior: none;
        }
        .rhythmos-touch-lane {
            touch-action: none !important;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
        }
        .rhythmos-touch-lane.rhythmos-touch-active {
            filter: brightness(1.35);
        }
    `;
    document.head.appendChild(style);
}

export function attachTouchInput({
    laneCount,
    keyByLane,
    selectorForLane = lane => `#lane-${lane}`,
    vibration = 8
}) {
    if (!Number.isInteger(laneCount) || laneCount < 1) {
        throw new TypeError('laneCount must be a positive integer');
    }
    if (!Array.isArray(keyByLane) || keyByLane.length !== laneCount) {
        throw new TypeError('keyByLane must contain one key per lane');
    }

    injectTouchStyles();

    for (let laneIndex = 0; laneIndex < laneCount; laneIndex++) {
        const laneElement = document.querySelector(selectorForLane(laneIndex));
        if (!laneElement || attachedRoots.has(laneElement)) continue;

        attachedRoots.add(laneElement);
        laneElement.classList.add('rhythmos-touch-lane');
        // Suppress the browser's long-press / context menu on playable lanes.
        laneElement.addEventListener('contextmenu', event => event.preventDefault());
        laneElement.addEventListener('dragstart', event => event.preventDefault());

        const key = keyByLane[laneIndex];
        laneElement.addEventListener('pointerdown', event => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            event.preventDefault();

            laneElement.classList.add('rhythmos-touch-active');
            window.setTimeout(() => {
                laneElement.classList.remove('rhythmos-touch-active');
            }, 75);

            const keyboardEvent = new KeyboardEvent('keydown', {
                key: key === 'Space' ? ' ' : key,
                code: keyCodeFor(key),
                bubbles: true,
                cancelable: true
            });
            // Mark synthetic input so Touch Edition can use its wider timing window.
            keyboardEvent.rhythmosTouch = true;
            document.dispatchEvent(keyboardEvent);

            if (vibration > 0 && typeof navigator.vibrate === 'function') {
                navigator.vibrate(vibration);
            }
        }, { passive: false });
    }

    return {
        laneCount,
        attached: Array.from({ length: laneCount }, (_, index) =>
            Boolean(document.querySelector(selectorForLane(index)))
        ).filter(Boolean).length
    };
}
