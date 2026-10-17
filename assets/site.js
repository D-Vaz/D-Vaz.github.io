/* ============ NIGHT SKY BACKGROUND ============
   Static layer (Milky Way band, faint stars, galaxies) is drawn once;
   only a fraction of stars twinkle. Respects "reduce motion" settings. */
(() => {
  const ENABLE_METEORS = true;   // occasional shooting star; set false to disable

  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  const colours = ['255,255,255', '205,218,255', '255,236,212', '185,205,255'];

  let w = 0, h = 0, dpr = 1, bg, twinkle = [], meteor = null, nextMeteor = 0;

  function dot(g, x, y, r, rgb, a) {
    g.fillStyle = `rgba(${rgb},${a})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }

  function milkyWay(g) {
    const diag = Math.hypot(w, h), band = h * 0.22;
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(-0.45);
    const lg = g.createLinearGradient(0, -band, 0, band);
    lg.addColorStop(0, 'rgba(120,140,210,0)');
    lg.addColorStop(0.5, 'rgba(140,150,215,0.055)');
    lg.addColorStop(1, 'rgba(120,140,210,0)');
    g.fillStyle = lg;
    g.fillRect(-diag / 2, -band, diag, band * 2);
    const n = Math.min(2500, (w * h) / 600);
    for (let i = 0; i < n; i++) {
      dot(g, rand(-diag / 2, diag / 2), gauss() * band * 0.35, rand(0.2, 0.6), '210,220,255', rand(0.04, 0.3));
    }
    g.restore();
  }

  function galaxy(g, x, y, size, ratio, angle, rgb, spiral) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(1, ratio);
    const halo = g.createRadialGradient(0, 0, 0, 0, 0, size);
    halo.addColorStop(0, 'rgba(255,244,222,0.6)');
    halo.addColorStop(0.07, `rgba(${rgb},0.30)`);
    halo.addColorStop(0.35, `rgba(${rgb},0.07)`);
    halo.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = halo;
    g.beginPath(); g.arc(0, 0, size, 0, Math.PI * 2); g.fill();
    if (spiral) {
      for (let arm = 0; arm < 2; arm++) {
        for (let i = 0; i < 260; i++) {
          const t = Math.random();
          const th = arm * Math.PI + t * 4.2;
          const r = size * (0.08 + 0.85 * t);
          const jitter = size * 0.05;
          dot(g, r * Math.cos(th) + gauss() * jitter, r * Math.sin(th) + gauss() * jitter,
              rand(0.3, 0.9), i % 3 ? rgb : '255,255,255', (1 - t) * rand(0.15, 0.45));
        }
      }
    }
    g.restore();
  }

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;

    bg = document.createElement('canvas');
    bg.width = w * dpr; bg.height = h * dpr;
    const g = bg.getContext('2d');
    g.scale(dpr, dpr);

    milkyWay(g);

    const m = Math.min(w, h);
    galaxy(g, w * 0.86, h * 0.20, m * 0.11, 0.42, -0.6, '170,190,255', true);
    galaxy(g, w * 0.09, h * 0.74, m * 0.07, 0.55, 0.9, '255,205,170', true);
    galaxy(g, w * 0.66, h * 0.88, m * 0.035, 0.6, 0.3, '255,225,195', false);
    galaxy(g, w * 0.30, h * 0.10, m * 0.022, 0.35, 1.2, '200,210,255', false);

    twinkle = [];
    const n = Math.min(900, Math.round((w * h) / 1700));
    for (let i = 0; i < n; i++) {
      const s = {
        x: rand(0, w), y: rand(0, h),
        r: Math.random() < 0.06 ? rand(1.1, 1.7) : rand(0.3, 1.0),
        a: rand(0.35, 0.95),
        c: colours[(Math.random() * colours.length) | 0],
        speed: rand(0.6, 2.2), phase: rand(0, Math.PI * 2)
      };
      if (s.r > 1.1) {                      // soft glow around bright stars
        const gl = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        gl.addColorStop(0, `rgba(${s.c},0.18)`);
        gl.addColorStop(1, `rgba(${s.c},0)`);
        g.fillStyle = gl;
        g.beginPath(); g.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2); g.fill();
      }
      if (Math.random() < 0.22 && !reduce) twinkle.push(s);
      else dot(g, s.x, s.y, s.r, s.c, s.a);
    }
  }

  function drawMeteor(t) {
    if (!meteor) {
      if (t < nextMeteor) return;
      const ang = rand(2.45, 2.75);
      meteor = { x: rand(w * 0.3, w * 0.95), y: rand(0, h * 0.35),
                 ux: Math.cos(ang), uy: Math.sin(ang),
                 v: rand(0.6, 0.9), len: rand(80, 140), born: t, life: rand(700, 1100) };
      nextMeteor = t + rand(10000, 20000);
    }
    const age = t - meteor.born;
    if (age > meteor.life) { meteor = null; return; }
    const a = Math.sin((age / meteor.life) * Math.PI) * 0.8;
    const hx = meteor.x + meteor.ux * meteor.v * age, hy = meteor.y + meteor.uy * meteor.v * age;
    const tx = hx - meteor.ux * meteor.len, ty = hy - meteor.uy * meteor.len;
    const lg = ctx.createLinearGradient(tx, ty, hx, hy);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(1, `rgba(255,248,230,${a})`);
    ctx.strokeStyle = lg; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
  }

  function frame(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(bg, 0, 0, w, h);
    for (const s of twinkle) {
      dot(ctx, s.x, s.y, s.r, s.c, s.a * (0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase)));
    }
    if (ENABLE_METEORS) drawMeteor(t);
    if (!reduce) requestAnimationFrame(frame);
  }

  setup();
  nextMeteor = performance.now() + rand(4000, 8000);
  if (reduce) frame(0); else requestAnimationFrame(frame);

  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // ignore small height changes (mobile address bar) to avoid redrawing the sky
      if (window.innerWidth !== w || Math.abs(window.innerHeight - h) > 120) {
        setup();
        if (reduce) frame(0);
      }
    }, 200);
  });
})();
