// ==========================================
// Rhythmos 判定システム
// ==========================================

const JUDGMENT_WINDOWS = {
    perfect: 0.05,
    success: 0.08,
    great: 0.10,
    super: 0.12,
    good: 0.135,
    bene: 0.15,
    miss: 0.15
};

export function judgeNote(note, currentTime, isTouch = false) {
    const diff = Math.abs(note.targetTime - currentTime);
    // Touch Edition: widen timing windows by 30% without changing keyboard judgment.
    const scale = isTouch ? 1.3 : 1;
    const windowFor = name => JUDGMENT_WINDOWS[name] * scale;

    if (diff < windowFor('perfect')) {
        return 'PERFECT';
    }

    if (diff < windowFor('success')) {
        return 'SUCCESS';
    }

    if (diff < windowFor('great')) {
        return 'GREAT';
    }

    if (diff < windowFor('super')) {
        return 'SUPER';
    }

    if (diff < windowFor('good')) {
        return 'GOOD';
    }

    if (diff < windowFor('bene')) {
        return 'BENE';
    }

    if (diff <= windowFor('miss')) {
        return 'MISS';
    }

    return null;
}
