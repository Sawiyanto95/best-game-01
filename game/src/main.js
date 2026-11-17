'use strict';
(() => {
  const canvas = document.getElementById('game'), status = document.getElementById('status');
  const renderer = Tideglass.createRenderer(canvas), input = Tideglass.createInput(canvas, renderer.toGame);
  const world = Tideglass.createWorld(), audio = Tideglass.createAudio(), C = Tideglass.config;
  let screen = 'title', last = performance.now(), accumulator = 0, visualTime = 0, best = 0;
  try { best = Number(localStorage.getItem('tideglass.best.v1')) || 0; } catch {}
  function announce(message) { status.textContent = message; }
  function startVoyage() {
    audio.unlock(); world.reset(); screen = 'play'; accumulator = 0;
    input.clear(); announce('Voyage started. Gather 36 sparks. Hold Space while moving, release to capture. Four hull points.');
  }
  function setPaused(paused) {
    screen = paused ? 'paused' : 'play'; input.clear(); accumulator = 0;
    announce(paused ? 'Paused. P or Escape resumes.' : 'Voyage resumed.');
  }
  function inside(x,y,w,h) { const p=input.pointer;return p.x>=x&&p.y>=y&&p.x<=x+w&&p.y<=y+h; }
  function processActions() {
    if(input.take('KeyM')) { audio.unlock(); audio.toggle(); }
    const confirm=input.take('Enter'), click=input.pointer.clicked;
    if(screen==='title') { if(confirm || (click&&inside(59,645,306,58))) startVoyage(); }
    else if(screen==='result') {
      if(confirm||input.take('KeyR')||(click&&inside(365,563,285,56))) startVoyage();
      else if(input.take('Escape')||(click&&inside(668,563,167,56))) {screen='title';input.clear();announce('Tideglass. Press Enter to begin.');}
    } else if(screen==='blessing') {
      let choice = -1;
      if(input.take('Digit1')||input.take('Numpad1')||(click&&inside(271,310,314,226))) choice=0;
      if(input.take('Digit2')||input.take('Numpad2')||(click&&inside(615,310,314,226))) choice=1;
      if(choice>=0) { audio.unlock();world.chooseBlessing(choice);screen='play';input.clear();accumulator=0;processWorldEvents(); }
    } else if(screen==='paused') { if(confirm||input.take('KeyP')||input.take('Escape')||(click&&inside(445,393,310,56))) setPaused(false); }
    else if(input.take('KeyP')||input.take('Escape')) setPaused(true);
  }
  function processWorldEvents() {
    for(const event of world.state.events) {
      audio.play(event.type,event.value);
      if(event.type==='hit') announce(`Hull hit. ${world.state.player.hp} hull remaining.`);
      if(event.type==='capture') announce(`${world.state.collected} of 36 sparks. Score ${world.state.score}.`);
      if(event.type==='lantern') announce(`${world.state.phase} lanterns lit. Hull restored.`);
    }
    world.state.events.length=0;
    if(world.state.choice && screen==='play') {screen='blessing';input.clear();announce('Lantern awake. Choose a blessing with 1 or 2.');}
    if(world.state.result && screen==='play') {
      screen='result';best=Math.max(best,world.state.score);
      try {localStorage.setItem('tideglass.best.v1',String(best));}catch{}
      input.clear();announce(`${world.state.result==='win'?'Victory':'Voyage ended'}. Score ${world.state.score}. Enter to sail again.`);
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed=Math.min(0.06,(now-last)/1000);last=now;visualTime+=elapsed;
    processActions();
    if(screen==='play') {
      accumulator+=elapsed;
      const controls={direction:input.direction(),weave:input.weaving(),dash:input.take('ShiftLeft')||input.take('ShiftRight')};
      while(accumulator>=C.step && screen==='play') {
        world.update(C.step,controls);controls.dash=false;accumulator-=C.step;processWorldEvents();
      }
    } else { accumulator=0;if(screen==='result') world.updateEffects(elapsed); }
    audio.update(screen==='play',world.state.phase);
    renderer.draw(world.state,screen,best,visualTime,input.pointer,audio.muted);input.endFrame();
  }
  window.addEventListener('blur',()=>{if(screen==='play')setPaused(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&screen==='play')setPaused(true);});
  // Read-only diagnostics let local browser tests inspect actual play without changing the rules.
  Object.defineProperty(window,'tideglassState',{get:()=>({screen,state:structuredClone(world.state)})});
  requestAnimationFrame(frame);
})();
