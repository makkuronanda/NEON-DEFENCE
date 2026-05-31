/* ============================================================
   NEON DEFENSE: OVERDRIVE III — loader.js
   ============================================================ */

(function initLoader() {
  // ── Floating particles ──
  const pContainer = document.getElementById('loader-particles');
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'lp';
    const colors = ['#00f5ff','#cc44ff','#ff00aa','#ffd700','#00ff88'];
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      bottom: ${Math.random() * 20}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${1 + Math.random() * 3}px;
      height: ${1 + Math.random() * 3}px;
      animation-duration: ${3 + Math.random() * 8}s;
      animation-delay: ${Math.random() * 6}s;
    `;
    pContainer.appendChild(p);
  }

  // ── Progress simulation ──
  const STEPS = [
    { pct: 8,  label: "CORE CRYSTAL MATRICES ONLINE...",     delay: 300 },
    { pct: 18, label: "LOADING UNIT ARCHIVES...",             delay: 280 },
    { pct: 30, label: "CALIBRATING DEFENSE GRID...",          delay: 320 },
    { pct: 42, label: "SYNCING BATTLE TOPOLOGIES...",         delay: 350 },
    { pct: 55, label: "DECRYPTING ENEMY SIGNATURES...",       delay: 280 },
    { pct: 66, label: "OVERDRIVE SUBSYSTEM ONLINE...",        delay: 300 },
    { pct: 75, label: "LOADING STAGE SECTOR DATA...",         delay: 250 },
    { pct: 84, label: "WEAPON TARGETING SYSTEMS READY...",    delay: 260 },
    { pct: 92, label: "GACHA RECRUIT POOL INITIALIZED...",    delay: 300 },
    { pct: 100, label: "ALL SYSTEMS OPERATIONAL.",            delay: 200 },
  ];

  const barEl   = document.getElementById('loader-bar');
  const pctEl   = document.getElementById('loader-percent');
  const labelEl = document.getElementById('loader-label');
  const logEl   = document.getElementById('loader-log');

  let stepIdx = 0;
  let elapsed = 0;

  function runStep() {
    if (stepIdx >= STEPS.length) {
      // Done – fade out loader, show app
      setTimeout(() => {
        document.getElementById('loader-screen').classList.add('fade-out');
        const app = document.getElementById('app');
        app.style.display = 'flex';
        app.style.flexDirection = 'column';
        // init hex particles in title screen now
        initTitle();
        updateMeta();
      }, 400);
      return;
    }

    const step = STEPS[stepIdx];
    barEl.style.width = step.pct + '%';
    pctEl.textContent = step.pct + '%';
    labelEl.textContent = step.label;

    // Add to log (keep last 3)
    const line = document.createElement('div');
    line.className = 'loader-log-line';
    line.textContent = '> ' + step.label;
    logEl.appendChild(line);
    if (logEl.children.length > 3) logEl.removeChild(logEl.firstChild);

    stepIdx++;
    elapsed += step.delay;
    setTimeout(runStep, step.delay);
  }

  // Start after a small initial pause
  setTimeout(runStep, 500);
})();
