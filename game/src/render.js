'use strict';
Tideglass.createRenderer = function createRenderer(canvas) {
  const C = Tideglass.config, P = C.colors, A = C.arena, ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    view.scale = Math.min(canvas.width / C.width, canvas.height / C.height);
    view.x = (canvas.width - C.width * view.scale) / 2; view.y = (canvas.height - C.height * view.scale) / 2;
  }
  window.addEventListener('resize', resize); resize();
  function toGame(x, y) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((x - rect.left) * canvas.width / rect.width - view.x) / view.scale, y: ((y - rect.top) * canvas.height / rect.height - view.y) / view.scale };
  }
  function text(str, x, y, size = 18, color = P.white, align = 'left', family = 'sans-serif', weight = 400) {
    ctx.font = `${weight} ${size}px ${family}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }
  function line(x1, y1, x2, y2, color = P.line, width = 1) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function circle(x, y, radius, color, stroke = false, width = 1) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (stroke) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); } else { ctx.fillStyle = color; ctx.fill(); }
  }
  function box(x, y, w, h, fill, stroke = null, r = 10) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function glow(x, y, radius, color, strength = 0.25) {
    ctx.save(); ctx.globalAlpha *= strength;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
  }
  function diamond(x, y, size, color, fill = true) {
    ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * 0.65, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size * 0.65, y); ctx.closePath();
    if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function path(points, close = false) {
    ctx.beginPath(); if (!points.length) return;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    if (close) ctx.closePath();
  }
  function drawSea(time) {
    ctx.fillStyle = P.ink; ctx.fillRect(0, 0, 1200, 760);
    // A flat deep-sea field keeps the fine chart lines crisp at small sizes.
    ctx.fillStyle = '#09232e'; ctx.fillRect(0, 0, 1200, 760);
    // An original bathymetric chart: nested, irregular contours, not a bitmap texture.
    for (let island = 0; island < 4; island++) {
      const cx = [150, 786, 330, 1000][island], cy = [180, 570, 680, 200][island];
      for (let ring = 0; ring < 9; ring++) {
        ctx.beginPath();
        for (let i = 0; i <= 70; i++) {
          const a = i / 70 * Math.PI * 2, r = 45 + ring * 24 + Math.sin(a * 3 + island) * 11 + Math.cos(a * 5 + island) * 7;
          const x = cx + Math.cos(a) * r * 1.4, y = cy + Math.sin(a) * r * 0.8;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = ring % 3 === 0 ? '#1a3c46' : '#12343e'; ctx.lineWidth = 0.8; ctx.stroke();
      }
    }
    for (let i = 0; i < 65; i++) {
      const x = (i * 137.51 + Math.sin(time * 0.13 + i) * 12 + 1200) % 1200;
      const y = (i * 91.73 - time * (2 + i % 3) % 760 + 760) % 760;
      circle(x, y, i % 5 === 0 ? 1.5 : 0.7, i % 7 === 0 ? '#73958a' : '#2c535c');
    }
  }
  function drawLantern(x, y, active, index, time, scale = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    if (active) glow(0, 0, 135, P.gold, 0.24);
    const color = active ? P.gold : '#41606a';
    circle(0, 0, 47, active ? '#6f6b47' : '#284852', true);
    circle(0, 0, 39, active ? '#938259' : '#284852', true);
    ctx.save(); ctx.rotate(time * (active ? 0.06 : 0.015));
    for (let petal = 0; petal < 8; petal++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.bezierCurveTo(-17, -30, -11, -52, 0, -60); ctx.bezierCurveTo(11, -52, 17, -30, 0, -22);
      ctx.fillStyle = active ? '#4a503c' : '#12343f'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.stroke();
      circle(0, -47, 2, color);
    }
    ctx.restore();
    diamond(0, 0, 24, color, false); diamond(0, 0, 14, active ? P.gold : '#32535f');
    if (active) { circle(0, 0, 6, P.white); circle(0, 0, 28 + Math.sin(time * 2) * 3, '#8b8758', true); }
    else text(['I','II','III'][index], 0, 6, 14, '#97a9a5', 'center', 'serif');
    ctx.restore();
  }
  function drawSpark(s, time) {
    const bob = Math.sin(time * 3 + s.phase) * 1.5;
    glow(s.x, s.y, 24, P.gold, 0.32);
    ctx.save(); ctx.translate(s.x, s.y + bob); ctx.rotate(Math.sin(time + s.phase) * 0.15);
    diamond(0, 0, 8, P.gold); diamond(0, 0, 3, '#fff9dc');
    line(-9, 10, -14, 16, '#716d45'); ctx.restore();
  }
  function drawHunter(h, time) {
    const warning = h.warning > 0;
    if (warning) {
      ctx.save(); ctx.globalAlpha = 0.45 + Math.sin(time * 9) * 0.2;
      ctx.setLineDash([5, 7]); circle(h.x, h.y, 30, P.coral, true); ctx.setLineDash([]);
      text('!', h.x, h.y + 6, 20, P.coral, 'center'); ctx.restore(); return;
    }
    ctx.save(); ctx.translate(h.x, h.y);
    if (h.kind === 'needle' && h.locked && h.charge > 0) {
      line(0, 0, h.vx * 250, h.vy * 250, '#a75d50', 1); circle(h.vx * 250, h.vy * 250, 5, P.coral, true);
    }
    ctx.rotate(h.kind === 'needle' && h.locked ? Math.atan2(h.vy, h.vx) : h.angle);
    glow(0, 0, 30, P.coral, 0.15);
    if (h.kind === 'needle') {
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-13, -12); ctx.lineTo(-7, 0); ctx.lineTo(-13, 12); ctx.closePath();
    } else {
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.bezierCurveTo(4, -20, -14, -19, -16, -3); ctx.lineTo(-24, -10); ctx.lineTo(-19, 3);
      ctx.lineTo(-25, 13); ctx.lineTo(-12, 9); ctx.bezierCurveTo(-2, 21, 10, 11, 16, 0);
    }
    ctx.fillStyle = '#753f40'; ctx.fill(); ctx.strokeStyle = P.coral; ctx.lineWidth = 2; ctx.stroke();
    circle(5, -3, 3, '#ffe0ba'); line(-9, -1, -3, 4, P.coral, 1); ctx.restore();
  }
  function drawSkiff(p, time, weaving = false) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    if (p.dash > 0) {
      for (let i = 1; i < 6; i++) { ctx.globalAlpha = (6 - i) * 0.09; diamond(-i * 17, 0, 15, P.teal); }
    }
    ctx.globalAlpha = p.safe > 0 ? 0.7 + Math.sin(time * 16) * 0.3 : 1;
    glow(0, 0, 40, P.teal, 0.4);
    ctx.beginPath(); ctx.moveTo(20, 0); ctx.quadraticCurveTo(5, -15, -15, -11); ctx.lineTo(-10, 0); ctx.lineTo(-15, 11); ctx.quadraticCurveTo(5, 15, 20, 0);
    ctx.fillStyle = '#1a5c61'; ctx.fill(); ctx.strokeStyle = P.teal; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fillStyle = P.white; ctx.fill();
    line(-12, -13, -17 - Math.sin(time * 12) * 3, -20, P.gold, 2);
    line(-12, 13, -17 - Math.sin(time * 12) * 3, 20, P.gold, 2);
    circle(-11, 0, weaving ? 5 : 3, weaving ? P.gold : P.teal);
    ctx.restore();
    if (p.safe > 0) { ctx.save(); ctx.globalAlpha = 0.3; circle(p.x, p.y, 29, P.teal, true, 1); ctx.restore(); }
  }
  function drawThread(s, time) {
    if (!s.weaving || s.thread.length < 1) return;
    const points = [...s.thread, s.player], first = points[0];
    path(points, true); ctx.fillStyle = 'rgba(96,234,213,0.045)'; ctx.fill('evenodd');
    ctx.save(); ctx.setLineDash([5, 7]); line(s.player.x, s.player.y, first.x, first.y, '#679d94', 1.3); ctx.restore();
    path(points); ctx.strokeStyle = 'rgba(96,234,213,0.16)'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    path(points); ctx.strokeStyle = P.teal; ctx.lineWidth = 2.8; ctx.stroke();
    circle(first.x, first.y, 7, P.gold, true, 2); circle(first.x, first.y, 3, P.white);
    circle(first.x, first.y, 13 + Math.sin(time * 5) * 2, '#6d9e8f', true);
    let count = 0;
    for (const item of [...s.sparks, ...s.hunters.filter(h => h.warning <= 0)]) {
      if (Tideglass.geometry.polygonContains(item, points)) {
        count++; circle(item.x, item.y, 15, '#b9d59b', true, 1);
      }
    }
    if (count) {
      box(s.player.x - 71, s.player.y - 62, 142, 28, '#143e44', '#50867c', 14);
      text(`RELEASE · ${count} INSIDE`, s.player.x, s.player.y - 43, 12, P.gold, 'center', 'sans-serif', 700);
    }
  }
  function drawArena(s, time) {
    box(A.x, A.y, A.w, A.h, 'rgba(5,24,34,0.28)', '#35535b', 18);
    ctx.save(); ctx.beginPath(); ctx.roundRect(A.x + 1, A.y + 1, A.w - 2, A.h - 2, 18); ctx.clip();
    for (let x = 66; x < 890; x += 48) for (let y = 146; y < 680; y += 48) {
      line(x - 2, y, x + 2, y, '#22414a'); line(x, y - 2, x, y + 2, '#22414a');
    }
    for (let i = 0; i < 3; i++) {
      const l=C.lanterns[i];
      drawLantern(l.x, l.y, i < s.phase, i, time);
      if(i===s.phase && s.collected % C.lanternQuota) {
        ctx.beginPath();ctx.arc(l.x,l.y,66,-Math.PI/2,-Math.PI/2+Math.PI*2*(s.collected%C.lanternQuota)/C.lanternQuota);
        ctx.strokeStyle=P.gold;ctx.lineWidth=2;ctx.stroke();
      }
    }
    for (const cap of s.captures) {
      ctx.save(); ctx.globalAlpha = Math.min(1, cap.life * 1.5);
      path(cap.polygon, true); ctx.fillStyle = cap.good ? 'rgba(96,234,213,0.18)' : 'rgba(138,175,181,0.06)'; ctx.fill('evenodd');
      ctx.strokeStyle = cap.good ? P.teal : P.muted; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    }
    for (const r of s.ripples) { ctx.save(); ctx.globalAlpha = r.life * 0.3; circle(r.x, r.y, r.radius, r.color, true, 2); ctx.restore(); }
    for (const spark of s.sparks) drawSpark(spark, time);
    drawThread(s, time);
    for (const hunter of s.hunters) drawHunter(hunter, time);
    for (const p of s.particles) { ctx.save(); ctx.globalAlpha = p.life / p.maxLife; circle(p.x, p.y, p.size, p.color); ctx.restore(); }
    drawSkiff(s.player, time, s.weaving);
    for (const l of s.labels) { ctx.save(); ctx.globalAlpha = Math.min(1, l.life); text(l.text, l.x, l.y, l.size, l.color, 'center', 'sans-serif', 700); ctx.restore(); }
    if (s.bannerTime > 0) {
      const alpha = Math.min(1, s.bannerTime, (4 - s.bannerTime) * 3);
      ctx.save(); ctx.globalAlpha = Math.max(0, alpha);
      box(150, 129, 625, 38, '#0c2b36', '#3b6464', 19);
      text(s.banner, 462, 154, 16, P.gold, 'center'); ctx.restore();
    }
    if (s.flash > 0) { ctx.fillStyle = `rgba(255,100,80,${s.flash * 0.7})`; ctx.fillRect(A.x, A.y, A.w, A.h); }
    ctx.restore();
    text('N', 462, 103, 11, P.muted, 'center');
    line(462, 108, 462, 119, '#50727b');
    text('SHOAL 07 / NIGHT SURVEY', 50, 675, 10, '#62868d');
  }
  function keycap(key, x, y, width = 34) {
    box(x, y - 21, width, 28, '#14323e', '#41616a', 5);
    text(key, x + width / 2, y - 1, 12, P.white, 'center', 'sans-serif', 700);
  }
  function button(label, x, y, w, h, pointer, primary = true) {
    const hover = pointer && pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h;
    box(x, y, w, h, primary ? hover ? '#a9f6db' : P.teal : hover ? '#264652' : '#15323e', primary ? null : '#4b6970', 8);
    text(label, x + w / 2, y + h / 2 + 6, 18, primary ? '#082c33' : P.white, 'center', 'sans-serif', 700);
  }
  function drawHud(s, best, muted) {
    text('TIDEGLASS', 32, 57, 34, P.white, 'left', 'Georgia');
    text('WEAVE THE SEA AWAKE', 34, 80, 10, P.muted, 'left', 'sans-serif', 700);
    const timeLeft = Math.max(0, Math.ceil(C.duration - s.elapsed)), minute = Math.floor(timeLeft / 60), sec = String(timeLeft % 60).padStart(2, '0');
    text('LIGHT 3 LANTERNS', 465, 46, 17, P.gold, 'center', 'sans-serif', 700);
    text(`${Math.min(C.target,s.collected)} / ${C.target} sparks gathered`, 465, 75, 18, P.white, 'center');
    text('TIDE RETURNS', 888, 42, 10, P.muted, 'right', 'sans-serif', 700);
    text(`${minute}:${sec}`, 888, 77, 32, timeLeft < 30 ? P.coral : P.white, 'right', 'Georgia');
    line(918, 32, 918, 688);
    text('YOUR HAUL', 944, 48, 11, P.muted, 'left', 'sans-serif', 700);
    text(String(s.score).padStart(5,'0'), 943, 94, 43, P.gold, 'left', 'Georgia');
    text(`BEST  ${best.toLocaleString()}`, 945, 119, 12, P.muted);
    text('SKIFF HULL', 944, 160, 11, P.muted, 'left', 'sans-serif', 700);
    for (let i = 0; i < s.player.maxHp; i++) {
      box(945 + i * (208 / s.player.maxHp), 174, 208 / s.player.maxHp - 11, 12, i < s.player.hp ? P.teal : '#19343f', i < s.player.hp ? null : '#34505a', 3);
    }
    text('THE LANTERNS', 944, 226, 11, P.muted, 'left', 'sans-serif', 700);
    C.lanterns.forEach((l, i) => {
      const lit = i < s.phase, current = i === s.phase, y = 244 + i * 65;
      box(939, y, 231, 55, lit ? '#253d38' : '#0e2a36', current ? '#60736a' : '#274652', 8);
      diamond(961, y + 27, 10, lit ? P.gold : current ? P.teal : '#3e5b64', lit);
      text(l.name, 982, y + 23, 18, lit ? P.gold : P.white, 'left', 'Georgia');
      text(lit ? 'AWAKE' : current ? `${s.collected % C.lanternQuota} / ${C.lanternQuota} SPARKS` : 'ASLEEP', 982, y + 42, 10, lit ? P.gold : P.muted, 'left', 'sans-serif', 700);
      if (lit) text('✓', 1150, y + 34, 21, P.gold, 'center');
    });
    text('SILK RESERVE', 944, 476, 11, P.muted, 'left', 'sans-serif', 700);
    box(944, 489, 222, 8, '#193a44', null, 4);
    box(944, 489, Math.max(1, s.spool / s.maxSpool * 222), 8, s.spool < 200 ? P.coral : P.teal, null, 4);
    text(s.weaving ? 'RELEASE TO CLOSE THE LOOP' : 'Refills when you stop weaving', 944, 519, 11, s.weaving ? P.gold : P.muted);
    keycap('⇧', 944, 553, 32);
    text(s.player.cooldown > 0 ? `Dash · ${s.player.cooldown.toFixed(1)}s` : 'Dash ready', 988, 552, 17, s.player.cooldown > 0 ? P.muted : P.teal);
    if (s.combo > 1 && s.comboTime > 0) {
      text(`×${s.combo}`, 944, 605, 38, P.gold, 'left', 'Georgia');
      text('CHAIN BONUS', 1000, 589, 11, P.gold, 'left', 'sans-serif', 700);
      box(1000, 601, 160 * s.comboTime / 11, 4, P.gold, null, 2);
    } else { text('Chain captures within 11s', 944, 595, 13, P.muted); text('for up to ×5 score.', 944, 615, 13, P.muted); }
    if(s.blessings.length) text(s.blessings.join(' · '), 944, 644, 11, P.teal);
    text(`M  SOUND ${muted ? 'OFF' : 'ON'}    P  PAUSE`, 944, 674, 11, P.muted);
    keycap('WASD', 34, 725, 57); text('move', 101, 724, 15, P.muted);
    keycap('SPACE / LMB', 172, 725, 112); text('hold to weave · release to capture', 295, 724, 15, P.white);
    keycap('SHIFT', 570, 725, 57); text('dash / cut silk', 638, 724, 15, P.muted);
    text('ENCLOSE GOLD + HUNTERS. AVOID CONTACT.', 1170, 725, 11, P.gold, 'right', 'sans-serif', 700);
  }
  function drawTitle(time, best, pointer, muted) {
    // A living diagram of the same skiff, lantern, sparks and silk used in play.
    const cx = 885, cy = 365;
    glow(cx, cy, 360, '#287b79', 0.24);
    circle(cx, cy, 256, '#385354', true); circle(cx, cy, 245, '#233f48', true);
    ctx.save(); ctx.setLineDash([2, 13]); circle(cx, cy, 272, '#5c6f60', true); ctx.restore();
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * Math.PI * 2, major = i % 4 === 0;
      line(cx + Math.cos(a) * 253, cy + Math.sin(a) * 253, cx + Math.cos(a) * (major ? 241 : 247), cy + Math.sin(a) * (major ? 241 : 247), '#65796f');
    }
    drawLantern(cx, cy, true, 0, time, 1.85);
    const polygon = [{x:740,y:270},{x:810,y:216},{x:1000,y:244},{x:1074,y:390},{x:1010,y:502},{x:826,y:523},{x:725,y:422}];
    path(polygon, true); ctx.fillStyle = 'rgba(96,234,213,0.06)'; ctx.fill();
    path(polygon); ctx.strokeStyle = '#194f55'; ctx.lineWidth = 15; ctx.stroke();
    path(polygon); ctx.strokeStyle = P.teal; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); ctx.setLineDash([6,8]); line(725,422,740,270,'#93b9a2',1.5); ctx.restore();
    circle(740,270,8,P.gold,true,2); circle(740,270,3,P.white);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + 0.2;
      drawSpark({x:cx+Math.cos(a)*142,y:cy+Math.sin(a)*116,phase:i},time);
    }
    drawHunter({x:1054,y:552,kind:'drifter',angle:-2.2,age:0,warning:0,id:0},time);
    drawHunter({x:710,y:180,kind:'needle',angle:0.7,charge:2,warning:0,id:1},time);
    drawSkiff({x:725,y:422,angle:-1.5,safe:0,dash:0},time,true);
    box(800,574,221,37,'#153a40','#4f7a71',18);
    text('YOUR LOOP. YOUR WEAPON.',910,598,12,P.gold,'center','sans-serif',700);
    text('01',1115,91,14,P.muted,'right'); text('A NIGHT AT SEA',660,91,11,P.muted);
    // Opaque editorial panel keeps every instruction readable at contact-sheet size.
    const fade = ctx.createLinearGradient(500,0,710,0); fade.addColorStop(0,P.ink); fade.addColorStop(1,'transparent');
    ctx.fillStyle = P.ink; ctx.fillRect(0,0,540,760); ctx.fillStyle=fade; ctx.fillRect(540,0,170,760);
    text('A LUMINOUS LOOP-HUNTING VOYAGE',58,78,11,P.gold,'left','sans-serif',700);
    line(58,100,530,100,'#3c595d');
    text('Tideglass',53,215,103,P.white,'left','Georgia');
    text('Weave the sea awake.',59,259,29,P.teal,'left','Georgia');
    text('Three lanterns sleep beneath the tide.',60,312,19,P.white);
    text('Gather 36 sparks before the 150s tide returns.',60,340,19,P.white);
    const instructions = [
      ['01','MOVE','WASD or arrow keys steer your skiff.'],
      ['02','WEAVE','Hold SPACE or left mouse as you move.'],
      ['03','CAPTURE','Release. Everything inside is yours.'],
    ];
    instructions.forEach(([number,title,detail], i) => {
      const y=395+i*65; text(number,60,y+3,14,P.gold,'left','Georgia');
      text(title,98,y,12,P.teal,'left','sans-serif',700); text(detail,98,y+25,16,P.white);
    });
    text('Trap red hunters. SHIFT dashes through danger.',60,589,16,P.muted);
    text('Wake a lantern. Choose a blessing. Go deeper.',60,614,16,P.muted);
    button('BEGIN VOYAGE   ↵',59,645,306,58,pointer);
    text('ENTER TO START',59,729,10,P.muted,'left','sans-serif',700);
    text(`BEST HAUL  ${best.toLocaleString()}`,530,729,12,P.gold,'right');
    text(`M · SOUND ${muted?'OFF':'ON'}`,1125,718,11,P.muted,'right');
  }
  function drawResult(s, best, pointer) {
    const win = s.result === 'win';
    ctx.fillStyle = 'rgba(3,16,23,0.78)'; ctx.fillRect(0,0,1200,760);
    box(268,104,664,552,'#0c2a35','#607366',18);
    line(300,115,900,115,'#a69a6a');
    text(win?'VOYAGE COMPLETE':'VOYAGE ENDED',600,155,12,win?P.teal:P.coral,'center','sans-serif',700);
    text(win?'The sea is alight.':'The deep keeps its glow.',600,218,46,P.white,'center','Georgia');
    text(win?'Three lanterns awake. One small skiff. A brighter ocean.':s.reason,600,252,17,P.muted,'center');
    for (let i=0;i<3;i++) drawLantern(510+i*90,304,i<s.phase,i,0,0.48);
    text('FINAL HAUL',600,362,11,P.gold,'center','sans-serif',700);
    text(s.score.toLocaleString(),600,423,62,P.gold,'center','Georgia');
    const stats=[['SPARKS',`${Math.min(C.target,s.collected)} / ${C.target}`],['HUNTERS',String(s.kills)],['BIGGEST CATCH',`${s.bestLoop} caught`]];
    stats.forEach(([title,value],i)=>{const x=397+i*203;text(title,x,465,10,P.muted,'center','sans-serif',700);text(value,x,494,24,P.white,'center','Georgia');});
    text(`BEST HAUL ${best.toLocaleString()}  ·  ${Math.floor(s.elapsed)}s AT SEA`,600,532,12,P.muted,'center');
    button('SAIL AGAIN   ↵',365,563,285,56,pointer);
    button('CHART / TITLE',668,563,167,56,pointer,false);
    text('ENTER / R TO RESTART',600,641,10,P.muted,'center','sans-serif',700);
  }
  function drawBlessing(s, pointer) {
    ctx.fillStyle = 'rgba(3,16,23,0.84)'; ctx.fillRect(0,0,1200,760);
    box(230,140,740,472,'#0c2a35','#6a7d69',18);
    text('LANTERN ' + s.phase + ' AWAKENS',600,188,12,P.gold,'center','sans-serif',700);
    text('The sea offers a blessing.',600,243,43,P.white,'center','Georgia');
    text('Choose your advantage for the next tide. Time is paused.',600,278,17,P.muted,'center');
    s.choice.forEach((blessing,i)=>{
      const x=271+i*344,hover=pointer.x>=x&&pointer.x<x+314&&pointer.y>=310&&pointer.y<536;
      box(x,310,314,226,hover?'#1a4147':'#12333f',hover?P.teal:'#49666a',12);
      keycap(String(i+1),x+23,348,30);
      text(blessing.tag,x+291,344,10,P.gold,'right','sans-serif',700);
      text(blessing.name,x+23,395,28,P.white,'left','Georgia');
      text(blessing.description,x+23,428,15,P.teal);
      const words=blessing.detail.split(' ');let first='',second='';
      for(const word of words) {if((first+' '+word).length<34&&!second)first+=(first?' ':'')+word;else second+=(second?' ':'')+word;}
      text(first,x+23,464,14,P.muted);text(second,x+23,485,14,P.muted);
      text('CHOOSE BLESSING  →',x+23,516,11,hover?P.gold:P.white,'left','sans-serif',700);
    });
    text('PRESS 1 / 2 OR CLICK A CARD',600,576,11,P.gold,'center','sans-serif',700);
  }
  function drawPause(pointer) {
    ctx.fillStyle='rgba(3,16,23,0.77)';ctx.fillRect(0,0,1200,760);
    box(365,242,470,273,'#0c2a35','#5f7d76',16);
    text('A moment of calm.',600,315,39,P.white,'center','Georgia');
    text('The tide will wait for you.',600,354,18,P.muted,'center');
    button('RESUME VOYAGE',445,393,310,56,pointer);
    text('P / ESC TO RESUME  ·  M TO MUTE',600,485,11,P.muted,'center');
  }
  function draw(s, screen, best, time, pointer, muted) {
    ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#05151f';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(view.scale,0,0,view.scale,view.x,view.y);
    drawSea(time);
    if(screen==='title') { drawTitle(time,best,pointer,muted); return; }
    ctx.save();
    if(s.shake>0 && screen==='play') ctx.translate(Math.sin(time*110)*s.shake,Math.cos(time*97)*s.shake*0.6);
    drawArena(s,time);ctx.restore();drawHud(s,best,muted);
    if(screen==='result') drawResult(s,best,pointer);
    if(screen==='paused') drawPause(pointer);
    if(screen==='blessing') drawBlessing(s,pointer);
  }
  return { draw, toGame };
};
