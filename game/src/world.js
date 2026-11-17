'use strict';
Tideglass.createWorld = function createWorld() {
  const C = Tideglass.config, G = Tideglass.geometry, A = C.arena;
  let serial = 0;
  const state = {};
  function random(min, max) { return min + Math.random() * (max - min); }
  function emit(type, value = 1) { state.events.push({ type, value }); }
  function reset() {
    Object.assign(state, {
      player: { x: 450, y: 415, angle: -Math.PI / 2, hp: 4, maxHp: 4, safe: 2, dash: 0, cooldown: 0, dx: 0, dy: -1 },
      sparks: [], hunters: [], particles: [], ripples: [], labels: [], captures: [],
      thread: [], threadUsed: 0, spool: C.threadLength, weaving: false, blocked: false,
      elapsed: 0, score: 0, collected: 0, kills: 0, loops: 0, bestLoop: 0,
      combo: 1, comboTime: 0, phase: 0, spawnTime: 6, refillTime: 0,
      banner: 'Gather gold. Enclose it. Release.', bannerTime: 4,
      maxSpool: C.threadLength, weaveSpeed: C.weaveSpeed, dashCooldown: 3, blessings: [], choice: null,
      result: null, events: [], shake: 0, flash: 0,
    });
    for (let i = 0; i < 3; i++) spawnCluster(i);
    spawnHunter('drifter', 822, 604, 3);
    spawnHunter('drifter', 90, 166, 5);
  }
  function spawnCluster(index = -1) {
    const centers = [{ x: 265, y: 282 }, { x: 666, y: 294 }, { x: 477, y: 543 }, { x: 202, y: 528 }, { x: 714, y: 535 }, { x: 461, y: 228 }];
    const center = centers[index < 0 ? Math.floor(random(0, centers.length)) : index];
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + random(-0.18, 0.18), radius = random(30, 68);
      const x = center.x + Math.cos(angle) * radius, y = center.y + Math.sin(angle) * radius;
      state.sparks.push({ x, y, homeX: x, homeY: y, phase: random(0, 6.28), id: serial++ });
    }
  }
  function spawnHunter(kind, x, y, warning = 1.4) {
    state.hunters.push({ x, y, kind, warning, age: 0, angle: 0, charge: 2.5, locked: false, vx: 0, vy: 0, id: serial++ });
  }
  function burst(x, y, color, count = 16, force = 100) {
    for (let i = 0; i < count; i++) {
      const a = random(0, Math.PI * 2), speed = random(20, force), life = random(0.35, 0.9);
      state.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life, maxLife: life, color, size: random(1.5, 4) });
    }
  }
  function label(text, x, y, color = C.colors.gold, size = 24) { state.labels.push({ text, x, y, life: 1.8, color, size }); }
  function cancelThread() { state.thread = []; state.weaving = false; state.threadUsed = 0; }
  function beginThread() {
    if (state.spool < 180) return;
    state.weaving = true; state.thread = [{ x: state.player.x, y: state.player.y }]; state.threadUsed = 0;
    emit('cast');
  }
  function sealLoop() {
    if (!state.weaving) return;
    const polygon = [...state.thread, { x: state.player.x, y: state.player.y }];
    // Use the bounding area only to reject tiny gestures. A figure-eight has zero
    // signed shoelace area but still encloses two valid pockets with even-odd fill.
    const xs = polygon.map(p => p.x), ys = polygon.map(p => p.y);
    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    cancelThread();
    if (polygon.length < 4 || area < 650) { emit('empty'); return; }
    let sparks = 0, hunters = 0, cx = 0, cy = 0;
    for (const p of polygon) { cx += p.x; cy += p.y; }
    cx /= polygon.length; cy /= polygon.length;
    state.sparks = state.sparks.filter(spark => {
      if (!G.polygonContains(spark, polygon)) return true;
      sparks++; burst(spark.x, spark.y, C.colors.gold, 12); return false;
    });
    state.hunters = state.hunters.filter(hunter => {
      if (hunter.warning > 0 || !G.polygonContains(hunter, polygon)) return true;
      hunters++; burst(hunter.x, hunter.y, C.colors.coral, 22, 160); return false;
    });
    const count = sparks + hunters;
    state.captures.push({ polygon, life: count ? 1 : 0.45, good: count > 0 });
    if (!count) { label('Empty water', cx, cy, C.colors.muted, 18); emit('empty'); return; }
    if (state.comboTime > 0) state.combo = Math.min(5, state.combo + 1); else state.combo = 1;
    state.comboTime = 11;
    const points = (sparks * 100 + hunters * 250) * state.combo;
    state.score += points; state.collected += sparks; state.kills += hunters;
    state.loops++; state.bestLoop = Math.max(state.bestLoop, count);
    label(`+${points.toLocaleString()}${state.combo > 1 ? '  ×' + state.combo : ''}`, cx, cy, C.colors.gold, 32);
    if (sparks || hunters) label([sparks ? `${sparks} SPARKS` : '', hunters ? `${hunters} TRAPPED` : ''].filter(Boolean).join(' + '), cx, cy + 30, C.colors.teal, 14);
    state.spool = Math.min(state.maxSpool, state.spool + count * 40);
    emit('capture', count);
    const nextPhase = Math.min(3, Math.floor(state.collected / C.lanternQuota));
    if (nextPhase > state.phase) {
      for (let i = state.phase; i < nextPhase; i++) {
        const l = C.lanterns[i]; burst(l.x, l.y, C.colors.gold, 65, 240);
        state.ripples.push({ x: l.x, y: l.y, radius: 20, life: 2, color: C.colors.gold });
      }
      state.phase = nextPhase; state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
      state.player.safe = 2; state.spool = state.maxSpool;
      state.banner = nextPhase === 3 ? 'The sea remembers its light.' : 'LANTERN LIT · Hull restored · The tide quickens';
      state.bannerTime = 4; emit('lantern');
      // A lit lantern sweeps nearby hunters away: a breathing space before the next tide.
      state.hunters = state.hunters.filter(h => { burst(h.x, h.y, C.colors.teal, 14); return false; });
      state.spawnTime = 3;
      if (nextPhase === 3) finish(true);
      else state.choice = C.blessings[nextPhase - 1];
    }
  }
  function dash(direction) {
    const p = state.player;
    if (p.cooldown > 0 || p.dash > 0) return;
    cancelThread(); state.blocked = true;
    const moving = Math.hypot(direction.x, direction.y) > 0;
    p.dx = moving ? direction.x : Math.cos(p.angle); p.dy = moving ? direction.y : Math.sin(p.angle);
    p.dash = 0.2; p.cooldown = state.dashCooldown; p.safe = Math.max(p.safe, 0.35);
    burst(p.x, p.y, C.colors.teal, 14); emit('dash');
  }
  function takeDamage(hunter) {
    const p = state.player;
    p.hp--; p.safe = 2; state.shake = 10; state.flash = 0.25;
    state.comboTime = 0; state.combo = 1; cancelThread(); state.blocked = true;
    state.spool = Math.max(state.spool, state.maxSpool * 0.6);
    burst(p.x, p.y, C.colors.coral, 28, 180); emit('hit');
    label('HULL −1', p.x, p.y - 28, C.colors.coral, 22);
    const length = G.distance(p, hunter) || 1;
    hunter.x -= (p.x - hunter.x) / length * 70; hunter.y -= (p.y - hunter.y) / length * 70;
    if (p.hp <= 0) finish(false, 'Your skiff slipped beneath the tide.');
  }
  function finish(win, reason = '') {
    state.result = win ? 'win' : 'lose'; state.reason = reason; cancelThread();
    if (win) state.score += Math.ceil(C.duration - state.elapsed) * 25 + state.player.hp * 500;
    emit(win ? 'win' : 'lose');
  }
  function updateHunters(dt) {
    const p = state.player;
    for (const h of state.hunters) {
      h.age += dt;
      if (h.warning > 0) { h.warning -= dt; continue; }
      const dx = p.x - h.x, dy = p.y - h.y, length = Math.hypot(dx, dy) || 1;
      h.angle = Math.atan2(dy, dx);
      if (h.kind === 'needle') {
        h.charge -= dt;
        if (h.charge < 0.75 && !h.locked) { h.locked = true; h.vx = dx / length; h.vy = dy / length; }
        if (h.charge <= 0) {
          h.x += h.vx * 390 * dt; h.y += h.vy * 390 * dt;
          if (h.charge < -0.6) { h.charge = 2.5; h.locked = false; }
        } else if (!h.locked) { h.x += dx / length * 35 * dt; h.y += dy / length * 35 * dt; }
      } else {
        const speed = 48 + state.phase * 13 + Math.min(22, state.elapsed / 8);
        const sway = Math.sin(h.age * 2 + h.id) * 16;
        h.x += (dx / length * speed - dy / length * sway) * dt;
        h.y += (dy / length * speed + dx / length * sway) * dt;
      }
      h.x = G.clamp(h.x, A.x + 14, A.x + A.w - 14); h.y = G.clamp(h.y, A.y + 14, A.y + A.h - 14);
      if (G.distance(h, p) < 25) {
        if (p.dash > 0) { h.dead = true; state.kills++; state.score += 100; burst(h.x, h.y, C.colors.coral, 22); emit('capture', 1); }
        else if (p.safe <= 0) takeDamage(h);
      }
    }
    state.hunters = state.hunters.filter(h => !h.dead);
  }
  function updateEffects(dt) {
    for (const p of state.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; }
    state.particles = state.particles.filter(p => p.life > 0);
    for (const l of state.labels) { l.life -= dt; l.y -= dt * 22; }
    state.labels = state.labels.filter(l => l.life > 0);
    for (const c of state.captures) c.life -= dt;
    state.captures = state.captures.filter(c => c.life > 0);
    for (const r of state.ripples) { r.life -= dt; r.radius += dt * 180; }
    state.ripples = state.ripples.filter(r => r.life > 0);
    state.shake = Math.max(0, state.shake - dt * 35); state.flash = Math.max(0, state.flash - dt);
  }
  function update(dt, controls) {
    updateEffects(dt);
    if (state.result || state.choice) return;
    state.elapsed += dt; state.bannerTime -= dt; state.comboTime = Math.max(0, state.comboTime - dt);
    if (!state.comboTime) state.combo = 1;
    const p = state.player, direction = controls.direction;
    p.safe = Math.max(0, p.safe - dt); p.cooldown = Math.max(0, p.cooldown - dt);
    if (!controls.weave) state.blocked = false;
    if (controls.dash) dash(direction);
    if (controls.weave && !state.weaving && !state.blocked && p.dash <= 0) beginThread();
    if (!controls.weave && state.weaving) sealLoop();
    if (state.result || state.choice) return;
    const old = { x: p.x, y: p.y };
    if (p.dash > 0) { p.dash -= dt; p.x += p.dx * 880 * dt; p.y += p.dy * 880 * dt; }
    else {
      const speed = state.weaving ? state.weaveSpeed : C.speed;
      p.x += direction.x * speed * dt; p.y += direction.y * speed * dt;
      if (direction.x || direction.y) p.angle = Math.atan2(direction.y, direction.x);
    }
    p.x = G.clamp(p.x, A.x + 18, A.x + A.w - 18); p.y = G.clamp(p.y, A.y + 18, A.y + A.h - 18);
    if (state.weaving) {
      const traveled = G.distance(old, p); state.threadUsed += traveled; state.spool = Math.max(0, state.spool - traveled);
      if (G.distance(p, state.thread[state.thread.length - 1]) > 6) state.thread.push({ x: p.x, y: p.y });
      if (state.spool <= 0) { sealLoop(); state.blocked = true; label('THREAD LIMIT', p.x, p.y - 36, C.colors.muted, 16); }
    } else state.spool = Math.min(state.maxSpool, state.spool + dt * 420);
    for (const s of state.sparks) {
      s.x = s.homeX + Math.sin(state.elapsed * 0.6 + s.phase) * 5;
      s.y = s.homeY + Math.cos(state.elapsed * 0.8 + s.phase) * 5;
    }
    state.refillTime -= dt;
    if (state.sparks.length < 15 && state.refillTime <= 0) { spawnCluster(); state.refillTime = 2; }
    state.spawnTime -= dt;
    if (state.spawnTime <= 0 && state.hunters.length < 9) {
      const edge = Math.floor(random(0, 4));
      let x = edge < 2 ? (edge === 0 ? A.x + 26 : A.x + A.w - 26) : random(A.x + 40, A.x + A.w - 40);
      let y = edge >= 2 ? (edge === 2 ? A.y + 26 : A.y + A.h - 26) : random(A.y + 40, A.y + A.h - 40);
      if (G.distance({x, y}, p) < 180) { x = p.x < 450 ? A.x + A.w - 35 : A.x + 35; }
      spawnHunter(state.phase > 0 && Math.random() < 0.45 ? 'needle' : 'drifter', x, y);
      state.spawnTime = Math.max(2.4, 6 - state.phase * 1.1 - state.elapsed / 100);
    }
    updateHunters(dt);
    if (!state.result && state.elapsed >= C.duration) finish(false, 'The tide returned before the lanterns woke.');
  }
  function chooseBlessing(index) {
    if (!state.choice || !state.choice[index]) return;
    const blessing = state.choice[index];
    if (blessing.key === 'speed') state.weaveSpeed *= 1.25;
    if (blessing.key === 'silk') state.maxSpool *= 1.4;
    if (blessing.key === 'dash') state.dashCooldown = 1.5;
    if (blessing.key === 'hull') { state.player.maxHp += 2; state.player.hp = state.player.maxHp; }
    state.blessings.push(blessing.name); state.spool = state.maxSpool;
    state.choice = null; state.blocked = true;
    state.banner = blessing.name.toUpperCase() + ' · ' + blessing.description;
    state.bannerTime = 4; state.player.safe = 2;
    emit('lantern');
  }
  reset();
  return { state, reset, update, updateEffects, chooseBlessing };
};
