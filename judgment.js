// ==========================================
// Rhythmos 判定システム
// ==========================================

const JUDGMENT_WINDOWS = {
    perfect: 0.05,
    success: 0.08,
    great: 0.12,
    miss: 0.15
};

export function judgeNote(note, currentTime) {
    const diff = Math.abs(note.targetTime - currentTime);

    if (diff < JUDGMENT_WINDOWS.perfect) {
        return 'PERFECT';
    }

    if (diff < JUDGMENT_WINDOWS.success) {
        return 'SUCCESS';
    }

    if (diff < JUDGMENT_WINDOWS.great) {
        return 'GREAT';
    }

    if (diff < JUDGMENT_WINDOWS.miss) {
        return 'MISS';
    }

    return null;
}
