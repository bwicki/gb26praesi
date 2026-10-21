/* Kein Motor. Kein Steuer. Kein Plan B. – Präsentationslogik
   Abschnitte: Zugangssperre · Sprache · Presets · Fusszeile · Karten/Animationen · Reveal */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

  /* ---------- Zugangssperre (kein Sicherheitsmechanismus, siehe README) ---------- */
  const GATE_PW = '1234';
  function initGate(done) {
    const g = $('gate');
    if (sessionStorage.getItem('unlocked') === '1') { g.hidden = true; done(); return; }
    g.hidden = false;
    $('gateForm').onsubmit = (e) => {
      e.preventDefault();
      if ($('gatePw').value.trim() === GATE_PW) {
        sessionStorage.setItem('unlocked', '1'); g.hidden = true; done();
      } else { $('gateErr').hidden = false; $('gatePw').value = ''; $('gatePw').focus(); }
    };
    setTimeout(() => $('gatePw').focus(), 60);
  }

  /* ---------- Sprache ---------- */
  const T = window.I18N || {};
  const t = (k) => (k in T ? T[k] : '⟨' + k + '⟩');
  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-notes]').forEach((el) => {
      const a = document.createElement('aside'); a.className = 'notes';
      a.textContent = t(el.dataset.i18nNotes); el.appendChild(a);
    });
  }

  /* ---------- Presets (10 / 20 / 30 / anhang) ---------- */
  const params = new URLSearchParams(location.search);
  const preset = params.get('preset') || sessionStorage.getItem('preset') || '30';
  sessionStorage.setItem('preset', preset);
  function applyPreset() {
    document.querySelectorAll('.slides > section').forEach((s) => {
      const list = (s.dataset.preset || '30').split(/\s+/);
      const ok = list.includes(preset) || (preset === 'anhang' && (list.includes('30') || list.includes('anhang')));
      if (!ok) s.remove();
    });
  }
  function initMenu() {
    const m = $('menu');
    document.querySelectorAll('#menu .opt').forEach((o) => {
      o.classList.toggle('active', o.dataset.preset === preset);
      o.onclick = () => { sessionStorage.setItem('preset', o.dataset.preset); location.href = location.pathname + '?preset=' + o.dataset.preset; };
    });
    return () => { m.hidden = !m.hidden; };
  }

  /* ---------- Fusszeile ---------- */
  function initFoot() {
    const v = window.APP_VERSION || { version: '?', date: '' };
    $('footVer').textContent = 'v' + v.version + ' · ' + v.date + (preset !== '30' ? ' · Preset ' + preset : '');
  }
  function updateChapter(section) {
    const c = section && section.dataset.chapter;
    $('footChap').textContent = c !== undefined ? t('ui.chapter.' + c) : '';
  }

  /* ---------- Geometrie ---------- */
  const R = 6371.0088;
  function hav(a, b) {
    const d2r = Math.PI / 180, dLat = (b[0] - a[0]) * d2r, dLon = (b[1] - a[1]) * d2r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * d2r) * Math.cos(b[0] * d2r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const pad = (n) => String(n).padStart(2, '0');
  function fmtLocal(unix, offH) {
    const d = new Date((unix + offH * 3600) * 1000);
    const wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getUTCDay()];
    return `${wd} ${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}. ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }

  /* ---------- Höhenprofil (Canvas) ---------- */
  function drawProfile(canvas, tracks, opts) {
    // tracks: [{pts, color}], opts: {ymax, cursor (0..1 Index-Anteil für tracks[0]), labels, sea:true}
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const c = canvas.getContext('2d'); c.scale(dpr, dpr); c.clearRect(0, 0, W, H);
    const m = { l: opts.labels ? 70 : 14, r: 14, t: 14, b: opts.labels ? 40 : 10 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const ymax = opts.ymax || Math.max(...tracks.flatMap((tr) => tr.pts.map((p) => p[3]))) * 1.08;
    const style = getComputedStyle(document.documentElement);
    const col = (n) => style.getPropertyValue(n).trim();
    // Gitter
    c.strokeStyle = col('--line'); c.lineWidth = 1; c.fillStyle = col('--text-dim');
    c.font = '18px ' + col('--mono');
    const step = ymax > 2000 ? 1000 : 250;
    for (let y = 0; y <= ymax; y += step) {
      const py = m.t + ph - (y / ymax) * ph;
      c.beginPath(); c.moveTo(m.l, py); c.lineTo(W - m.r, py); c.stroke();
      if (opts.labels) c.fillText(y + ' m', 8, py + 6);
    }
    const spanAll = Math.max(1, ...tracks.map((tr) => tr.pts.length ? tr.pts[tr.pts.length - 1][0] - tr.pts[0][0] : 1));
    tracks.forEach((tr, ti) => {
      const pts = tr.pts, n = pts.length; if (!n) return;
      const t0 = pts[0][0], span = spanAll;
      const X = (p) => m.l + ((p[0] - t0) / span) * pw, Y = (p) => m.t + ph - (p[3] / ymax) * ph;
      const upto = opts.cursor !== undefined && ti === 0 ? Math.max(1, Math.floor(opts.cursor * n)) : n;
      // Wasserflächen
      if (opts.sea !== false) {
        c.fillStyle = 'rgba(111,168,220,' + (tracks.length > 1 ? 0.10 : 0.18) + ')';
        let s = -1;
        for (let i = 0; i < n; i++) {
          const sea = pts[i][4] === 1;
          if (sea && s < 0) s = i;
          if ((!sea || i === n - 1) && s >= 0) { c.fillRect(X(pts[s]), m.t, Math.max(1, X(pts[i]) - X(pts[s])), ph); s = -1; }
        }
      }
      // Linie
      c.strokeStyle = tr.color; c.lineWidth = tracks.length > 1 ? 3 : 2.5; c.beginPath();
      for (let i = 0; i < upto; i++) { const x = X(pts[i]), y = Y(pts[i]); i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      if (tr.label) { c.fillStyle = tr.color; c.font = '600 22px ' + col('--font'); c.fillText(tr.label, m.l + 12, m.t + 26 + ti * 30); }
      // Zeitachse
      if (opts.labels && ti === 0) {
        c.fillStyle = col('--text-dim'); c.font = '18px ' + col('--mono');
        for (let h = 0; h <= span / 3600; h += 6) {
          const x = m.l + (h * 3600 / span) * pw;
          c.fillText(h + ' h', x - 10, H - 12);
          c.strokeStyle = col('--line'); c.beginPath(); c.moveTo(x, m.t + ph); c.lineTo(x, m.t + ph + 6); c.stroke();
        }
      }
      if (opts.cursor !== undefined && ti === 0) {
        const x = X(pts[Math.min(n - 1, upto - 1)]);
        c.strokeStyle = col('--amber'); c.lineWidth = 2; c.beginPath(); c.moveTo(x, m.t); c.lineTo(x, m.t + ph); c.stroke();
      }
    });
  }

  /* ---------- Karten ---------- */
  const TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  function makeMap(el) {
    const map = L.map(el, { zoomControl: false, attributionControl: true, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false });
    L.tileLayer(TILE, { attribution: ATTR, maxZoom: 12, subdomains: 'abcd' }).addTo(map);
    return map;
  }

  class TrackAnim {
    constructor(section) {
      this.sec = section; this.data = (window.TRACKS || {})[section.dataset.track];
      this.secs = +section.dataset.secs || 45; this.off = +section.dataset.utcoff || 2;
      this.ready = false; this.playing = false; this.prog = 0;
      this.btn = section.querySelector('.play'); if (this.btn) this.btn.onclick = () => this.toggle();
    }
    init() {
      if (this.ready || !this.data) return;
      const pts = this.data.points; this.pts = pts;
      const style = getComputedStyle(document.documentElement);
      this.cAmber = style.getPropertyValue('--amber').trim(); this.cSea = style.getPropertyValue('--sea').trim();
      this.map = makeMap(this.sec.querySelector('.map'));
      const ll = pts.map((p) => [p[1], p[2]]);
      this.bounds = L.latLngBounds(ll);
      this.map.fitBounds(this.bounds, { padding: [160, 160] });
      // Ganze Spur schwach im Hintergrund
      L.polyline(ll, { color: '#ffffff', weight: 2, opacity: .18, interactive: false }).addTo(this.map);
      this.land = L.polyline([], { color: this.cAmber, weight: 4, opacity: .95, interactive: false }).addTo(this.map);
      this.sea = L.polyline([], { color: this.cSea, weight: 4, opacity: .95, interactive: false }).addTo(this.map);
      this.marker = L.marker(ll[0], { icon: L.divIcon({ className: 'balloon-marker', iconSize: [18, 18] }), interactive: false }).addTo(this.map);
      L.circleMarker(ll[0], { radius: 7, color: '#fff', weight: 2, fillColor: this.cAmber, fillOpacity: 1 }).addTo(this.map);
      this.hud = { time: this.sec.querySelector('[data-hud=time]'), alt: this.sec.querySelector('[data-hud=alt]'), gs: this.sec.querySelector('[data-hud=gs]'), dist: this.sec.querySelector('[data-hud=dist]') };
      this.canvas = this.sec.querySelector('.prof canvas');
      this.ready = true; this.render(0);
      setTimeout(() => this.map.invalidateSize(), 50);
    }
    render(prog) {
      this.prog = prog; const pts = this.pts, n = pts.length;
      const k = Math.max(1, Math.min(n, Math.round(prog * n)));
      const landRuns = [], seaRuns = []; let run = [], sea = pts[0][4] === 1;
      for (let i = 0; i < k; i++) {
        const p = pts[i], s = p[4] === 1;
        if (s !== sea) { (sea ? seaRuns : landRuns).push(run); run = [[pts[i - 1][1], pts[i - 1][2]]]; sea = s; }
        run.push([p[1], p[2]]);
      }
      (sea ? seaRuns : landRuns).push(run);
      this.land.setLatLngs(landRuns); this.sea.setLatLngs(seaRuns);
      const p = pts[k - 1]; this.marker.setLatLng([p[1], p[2]]);
      if (this.hud.time) this.hud.time.textContent = fmtLocal(p[0], this.off);
      if (this.hud.alt) this.hud.alt.textContent = p[3] + ' m';
      if (this.hud.gs) this.hud.gs.textContent = p[5].toFixed(0) + ' kt';
      if (this.hud.dist) this.hud.dist.textContent = hav([pts[0][1], pts[0][2]], [p[1], p[2]]).toFixed(0) + ' km';
      if (this.canvas) drawProfile(this.canvas, [{ pts, color: this.cAmber }], { cursor: prog, labels: false });
    }
    toggle() { this.playing ? this.pause() : this.play(); }
    play() {
      if (!this.ready) this.init();
      if (this.prog >= 1) this.prog = 0;
      this.playing = true; if (this.btn) this.btn.textContent = t('ui.pause');
      const start = performance.now() - this.prog * this.secs * 1000;
      const step = (now) => {
        if (!this.playing) return;
        const pr = Math.min(1, (now - start) / (this.secs * 1000));
        this.render(pr);
        if (pr < 1) this.raf = requestAnimationFrame(step); else this.pause(true);
      };
      this.raf = requestAnimationFrame(step);
    }
    pause(finished) { this.playing = false; cancelAnimationFrame(this.raf); if (this.btn) this.btn.textContent = finished ? '↺ ' + t('ui.play') : t('ui.play'); }
    reset() { this.pause(); if (this.ready) this.render(0); }
  }

  /* Dilemma-Karte: schematische Sperrgebiete + unsere Spur */
  function initDilemma(section) {
    if (section._done) return; section._done = true;
    const map = makeMap(section.querySelector('.map'));
    const style = getComputedStyle(document.documentElement);
    const red = style.getPropertyValue('--red').trim(), amber = style.getPropertyValue('--amber').trim(), sea = style.getPropertyValue('--sea').trim();
    const closed = { color: red, weight: 1, fillColor: red, fillOpacity: .22, interactive: false };
    // Schematisch, nicht amtlich: Kaliningrad, Belarus, Russland (Westrand)
    L.polygon([[55.30, 19.60], [55.30, 22.85], [54.33, 22.85], [54.33, 19.60]], closed).addTo(map);
    L.polygon([[56.15, 23.20], [56.15, 32.80], [51.25, 32.80], [51.25, 23.60]], closed).addTo(map);
    L.polygon([[69.0, 29.5], [69.0, 40.0], [56.15, 40.0], [56.15, 27.9], [60.3, 28.3], [61.5, 29.5]], closed).addTo(map);
    // Suwałki-Lücke (Korridor Polen–Litauen zwischen Kaliningrad und Belarus)
    L.polygon([[54.33, 22.85], [54.33, 23.55], [54.0, 23.55], [54.0, 22.85]], { color: amber, weight: 2, fillColor: amber, fillOpacity: .35, dashArray: '6 6', interactive: false }).addTo(map);
    const tr = (window.TRACKS || {}).finnland;
    if (tr) {
      const pts = tr.points, land = [], seaR = []; let run = [], s = pts[0][4] === 1;
      pts.forEach((p, i) => { const ps = p[4] === 1; if (ps !== s) { (s ? seaR : land).push(run); run = [[pts[i - 1][1], pts[i - 1][2]]]; s = ps; } run.push([p[1], p[2]]); });
      (s ? seaR : land).push(run);
      L.polyline(land, { color: amber, weight: 4, interactive: false }).addTo(map);
      L.polyline(seaR, { color: sea, weight: 4, interactive: false }).addTo(map);
    }
    // Beschriftungen
    const lab = (ll, txt, cls) => L.marker(ll, { icon: L.divIcon({ className: 'maplab ' + (cls || ''), html: txt, iconSize: null }), interactive: false }).addTo(map);
    lab([54.80, 21.2], 'Kaliningrad'); lab([53.2, 28.6], 'Belarus'); lab([61.2, 34.0], 'Russland'); lab([53.65, 22.6], 'Suwałki-Lücke · 35 km');
    lab([51.75, 6.9], 'Gladbeck'); lab([60.55, 26.4], 'Loviisa');
    map.fitBounds([[49.5, 4.5], [62.5, 34.0]], { padding: [40, 40] });
    setTimeout(() => map.invalidateSize(), 50);
  }

  /* Zeitstrahl 1906–2026 (SVG, Fragmente je Marker) */
  function buildTimeline(el) {
    const ev = [
      [1906, 'e1906', 0], [1908, 'e1908', 0], [1914, 'e1914', 1], [1923, 'e1923', 1], [1939, 'e1939', 1],
      [1983, 'e1983', 0], [1995, 'e1995', 1], [2005, 'e2005', 0], [2026, 'e2026', 0]];
    const x0 = 40, x1 = 1640, y = 260, X = (yr) => x0 + ((yr - 1906) / 120) * (x1 - x0);
    let s = `<svg viewBox="0 0 1680 560" xmlns="http://www.w3.org/2000/svg">`;
    s += `<line class="axis" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`;
    s += `<line class="gap" x1="${X(1914)}" y1="${y}" x2="${X(1919)}" y2="${y}"/><line class="gap" x1="${X(1939)}" y1="${y}" x2="${X(1982)}" y2="${y}"/>`;
    [1906, 1930, 1960, 1990, 2026].forEach((yr) => { s += `<text class="y" x="${X(yr) - 30}" y="${y + 44}">${yr}</text>`; });
    ev.forEach(([yr, key, dark], i) => {
      const x = X(yr), slot = i % 4, up = slot % 2 === 0, far = slot >= 2, ty = up ? (far ? y - 200 : y - 90) : (far ? y + 220 : y + 110);
      const txt = t('s1.4.' + key).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const words = txt.split(' '); const lines = []; let cur = '';
      words.forEach((w) => { if ((cur + ' ' + w).trim().length > 26) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }); lines.push(cur.trim());
      const anchor = x > 1300 ? 'end' : (x < 300 ? 'start' : 'middle');
      s += `<g class="fragment" data-fragment-index="${i}">`;
      s += `<circle class="mark ${dark ? 'dark' : ''}" cx="${x}" cy="${y}" r="13"/>`;
      s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${up ? ty + 14 : ty - 34}" stroke="#243040" stroke-width="2"/>`;
      lines.forEach((ln, k) => { s += `<text class="lab" text-anchor="${anchor}" x="${x}" y="${(up ? ty - (lines.length - 1 - k) * 30 : ty + k * 30)}">${ln}</text>`; });
      s += `</g>`;
    });
    el.innerHTML = s + '</svg>';
  }

  /* ---------- Reveal ---------- */
  function startReveal() {
    applyPreset(); applyI18n(); initFoot();
    const toggleMenu = initMenu();
    document.querySelectorAll('.timeline').forEach(buildTimeline);
    const anims = new Map();
    document.querySelectorAll('section[data-track]').forEach((s) => anims.set(s, new TrackAnim(s)));
    let current = null;
    const onShow = (sec) => {
      current = sec; updateChapter(sec);
      if (sec.dataset.track) { const a = anims.get(sec); a.init(); a.reset(); }
      if (sec.classList.contains('dilemma')) initDilemma(sec);
      sec.querySelectorAll('canvas[data-profile]').forEach((cv) => {
        const names = cv.dataset.profile.split(','), cols = [getComputedStyle(document.documentElement).getPropertyValue('--amber').trim(), getComputedStyle(document.documentElement).getPropertyValue('--sea').trim()];
        const labels = (cv.dataset.labels || '').split(',');
        const trs = names.map((n, i) => ({ pts: (window.TRACKS[n] || { points: [] }).points, color: cols[i % 2], label: labels[i] || '' }));
        drawProfile(cv, trs, { labels: true, ymax: +cv.dataset.ymax || undefined, sea: names.length === 1 });
      });
    };
    Reveal.initialize({
      width: 1920, height: 1080, margin: 0, minScale: 0.1, maxScale: 2.5,
      center: false, hash: true, controls: false, progress: true, slideNumber: 'c/t',
      transition: 'fade', backgroundTransition: 'fade', transitionSpeed: 'default',
      plugins: [RevealNotes],
      keyboard: {
        77: () => toggleMenu(),                                  // M
        80: () => { const a = current && anims.get(current); if (a) a.toggle(); },  // P
      },
    }).then(() => { onShow(Reveal.getCurrentSlide()); });
    Reveal.on('slidechanged', (e) => { if (current && anims.get(current)) anims.get(current).pause(); onShow(e.currentSlide); });
    Reveal.on('resize', () => { if (current) onShow(current); });
    window.addEventListener('resize', () => { anims.forEach((a) => a.ready && a.map.invalidateSize()); });
  }

  document.addEventListener('DOMContentLoaded', () => initGate(startReveal));
})();
