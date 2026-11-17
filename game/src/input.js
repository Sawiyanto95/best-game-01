'use strict';
Tideglass.createInput = function createInput(canvas, toGame) {
  const held = new Set(), presses = new Set();
  const pointer = { x: 0, y: 0, down: false, clicked: false };
  const keys = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space','Enter','Escape','KeyP','KeyM','KeyR','ShiftLeft','ShiftRight','Digit1','Digit2','Numpad1','Numpad2'];
  window.addEventListener('keydown', e => {
    if (!keys.includes(e.code)) return;
    e.preventDefault();
    if (!held.has(e.code)) presses.add(e.code);
    held.add(e.code);
  });
  window.addEventListener('keyup', e => held.delete(e.code));
  function locate(e) { Object.assign(pointer, toGame(e.clientX, e.clientY)); }
  canvas.addEventListener('pointermove', locate);
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    locate(e); pointer.down = true; pointer.clicked = true;
    canvas.focus(); canvas.setPointerCapture(e.pointerId);
  });
  window.addEventListener('pointerup', () => { pointer.down = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  function clear() { held.clear(); presses.clear(); pointer.down = false; pointer.clicked = false; }
  window.addEventListener('blur', clear);
  return {
    pointer,
    held: code => held.has(code),
    take(code) { const value = presses.has(code); presses.delete(code); return value; },
    direction() {
      let x = Number(held.has('KeyD') || held.has('ArrowRight')) - Number(held.has('KeyA') || held.has('ArrowLeft'));
      let y = Number(held.has('KeyS') || held.has('ArrowDown')) - Number(held.has('KeyW') || held.has('ArrowUp'));
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length };
    },
    weaving: () => held.has('Space') || pointer.down,
    endFrame() { presses.clear(); pointer.clicked = false; },
    clear,
  };
};
