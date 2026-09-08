/* ============================================================
   NEON DEFENSE: OVERDRIVE III — loader.js
   ============================================================ */

(function initLoader() {
  // ── Floating particles ──
  const pContainer = document.getElementById('loader-particles');
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'lp';
    const colors = ['#00f5ff','#cc44ff','#ff00aa','#ffd700','#00ff88','#aa55ff','#55ff44'];
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
    { pct: 5,  label: "CORE CRYSTAL MATRICES ONLINE...",        delay: 260 },
    { pct: 12, label: "LOADING UNIT ARCHIVES [31 UNITS]...",    delay: 240 },
    { pct: 20, label: "CALIBRATING DEFENSE GRID...",            delay: 260 },
    { pct: 28, label: "SYNCING BATTLE TOPOLOGIES [7 PATHS]...", delay: 280 },
    { pct: 36, label: "DECRYPTING ENEMY SIGNATURES...",         delay: 240 },
    { pct: 44, label: "OVERDRIVE SUBSYSTEM ONLINE...",          delay: 240 },
    { pct: 51, label: "LOADING STAGE SECTOR DATA [9 STAGES]...",delay: 260 },
    { pct: 58, label: "WEAPON TARGETING SYSTEMS READY...",      delay: 220 },
    { pct: 65, label: "GACHA RECRUIT POOL INITIALIZED...",      delay: 240 },
    { pct: 70, label: "MATERIAL FORGE SYSTEMS ONLINE...",         delay: 230 },
    { pct: 75, label: "TEMPORAL & STARFIELD WEAPONS ARMED...",    delay: 230 },
    { pct: 79, label: "ARCLIGHT / PULSAR / METEOR ARMED...",    delay: 230 },
    { pct: 86, label: "BIOME HAZARDS ARMED [VOID/STORM/ICE]...",delay: 240 },
    { pct: 93, label: "ORBITAL & ZERO POINT SECTORS LINKED...", delay: 230 },
    { pct: 100, label: "ALL SYSTEMS OPERATIONAL. GOOD LUCK.",   delay: 200 },
  ];

  const barEl   = document.getElementById('loader-bar');
  const pctEl   = document.getElementById('loader-percent');
  const labelEl = document.getElementById('loader-label');
  const logEl   = document.getElementById('loader-log');

  let stepIdx = 0;

  function runStep() {
    if (stepIdx >= STEPS.length) {
      setTimeout(() => {
        document.getElementById('loader-screen').classList.add('fade-out');
        const app = document.getElementById('app');
        app.style.display = 'flex';
        app.style.flexDirection = 'column';

        // ── ローカルセーブを起動時に適用 ──────────────────────
        // Googleログイン前の状態でも前回のゲストデータを復元する。
        // ログイン後は onAuthChanged → loadFromCloud が呼ばれ、
        // クラウドとの照合・マージが行われるためここは上書きされる場合がある。
        if (typeof window.applyLocalSaveOnBoot === 'function') {
          window.applyLocalSaveOnBoot();
        }

        initTitle();
        updateMeta();
      }, 400);
      return;
    }

    const step = STEPS[stepIdx];
    barEl.style.width = step.pct + '%';
    pctEl.textContent = step.pct + '%';
    labelEl.textContent = step.label;

    const line = document.createElement('div');
    line.className = 'loader-log-line';
    line.textContent = '> ' + step.label;
    logEl.appendChild(line);
    if (logEl.children.length > 3) logEl.removeChild(logEl.firstChild);

    stepIdx++;
    setTimeout(runStep, step.delay);
  }

  setTimeout(runStep, 500);
})();
