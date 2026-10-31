# Rhythmos Abyss and Eden + SHH Edition
## Android Touch Edition - implementation notes

This branch is the touch-enabled development line. The existing keyboard release remains on `main` and is not overwritten.

### Included games

| Game | Lanes | Touch-to-key mapping |
|---|---:|---|
| Abyss | 4 | A / D / J / L |
| Eden | 4 | A / D / J / L |
| Surpass | 8 | A / S / D / F / J / K / L / ; |
| Halloween | 4 | A / S / K / L |
| Heaven's Door | 7 | A / S / D / Space / J / K / L |

SHH means **Surpass, Halloween, Heaven's Door**.

### How touch input works

`TouchInput.js` attaches Pointer Events to each lane. Every lane tap is translated into the keyboard event already consumed by that game's existing input handler. This keeps the original timing judgment and scoring logic in place and allows multiple pointers to hit different lanes at the same time.

- Touch, pen and primary mouse input are supported.
- A short lane flash provides visual feedback.
- Short vibration feedback is requested when the browser/device supports it.
- Keyboard input remains available.
- The module does not change chart formats or judgment windows.

### Current development status

- Abyss / Eden: touch input wired to the existing 4-lane game logic.
- Surpass: touch input wired to the existing 8-lane game logic.
- Halloween: touch input wired to the existing 4-lane game logic.
- Heaven's Door: touch input wired to the existing 7-lane prototype. The underlying Heaven's Door gameplay remains a work in progress.

### Testing checklist

1. Open each game's normal play page on an Android browser.
2. Start a song using the existing song-selection UI.
3. Tap each lane and confirm that the matching lane receives input.
4. Test two or more different lanes with separate fingers.
5. Confirm that the keyboard controls still work on desktop.
6. Test on the target Android device; this branch has not yet been device-tested.

### Important

This is a development branch, not a verified production APK. The original keyboard version on `main` is preserved.
