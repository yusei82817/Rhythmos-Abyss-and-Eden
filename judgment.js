// ==========================================
// Rhythmos 判定システム
// ==========================================

const JUDGMENT_WINDOWS = {
    perfect: 0.05,
    great: 0.10,
    miss: 0.15
};

export function judgeNote(note, currentTime) {
    const diff = Math.abs(note.targetTime - currentTime);

    if (diff < JUDGMENT_WINDOWS.perfect) {
        return 'PERFECT';
    }

    if (diff < JUDGMENT_WINDOWS.great) {
        return 'GREAT';
    }

    if (diff < JUDGMENT_WINDOWS.miss) {
        return 'MISS';
    }

    return null;
}
