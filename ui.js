/* ============================================================
   NEON DEFENSE: OVERDRIVE III — ui.js
   ============================================================ */

let gameState = null;
let animFrameId = null;

// ────────────────────────────────────────────────
//  TITLE
// ────────────────────────────────────────────────
function initTitle() {
  const cont = document.getElementById('title-hexagons');
  if (!cont || cont.children.length > 0) return;
  for (let i = 0; i < 20; i++) {
    const h = document.createElement('div');
    h.className = 'hex-particle';
    h.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 10}s;
      width: ${30 + Math.random() * 80}px;
      height: ${30 + Math.random() * 80}px;
      border-color: rgba(0,${Math.random()>0.5?245:170},${Math.random()>0.5?255:170},${0.1+Math.random()*0.2});
    `;
    cont.appendChild(h);
  }
}

// ────────────────────────────────────────────────
//  NAVIGATION
// ────────────────────────────────────────────────
function switchScreen(id) {
  if (gameState && gameState.state === 'playing' && id !== 'game') {
    if (!confirm("作戦を中止しますか？")) return;
    endGameLoop();
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${id}`).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const t = Array.from(document.querySelectorAll('.tab-btn'))
    .find(b => b.getAttribute('onclick')?.includes(`'${id}'`));
  if (t) t.classList.add('active');
  if (id === 'stage') renderStages();
  if (id === 'party') renderParty();
  if (id === 'augment') renderAugments();
  if (id === 'gacha') syncSoundToggleUI();
  updateMeta();
}

function updateMeta() {
  const el = document.getElementById('meta-currency');
  if (el) el.innerText = playerData.crystals;
}

// ────────────────────────────────────────────────
//  STAGE SCREEN
// ────────────────────────────────────────────────
function renderStages() {
  const c = document.getElementById('stage-list');
  c.innerHTML = '';
  STAGE_TEMPLATES.forEach(s => {
    const isEndless = !!s.endless;
    const diffColor = isEndless ? '#ffffff' : (s.diff === 'NORMAL' ? 'var(--green)' : s.diff === 'HARD' ? 'var(--orange)' : 'var(--red)');
    const isNew = s.id >= 6 && !isEndless;
    const bestWave = playerData.stageBestWave?.[s.id] || 0;
    const cleared  = !!playerData.stageCleared?.[s.id];
    const wavesLabel = isEndless ? '∞' : s.waves;
    const card = document.createElement('div');
    card.className = 'stage-card' + (isEndless ? ' endless-card' : '');
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div class="stage-name" style="color:${s.color};text-shadow:0 0 8px ${s.color}44;">${s.name}</div>
        <div style="display:flex;gap:6px;align-items:center;">
          ${cleared ? '<span style="font-family:var(--font-main);font-size:0.5rem;letter-spacing:2px;padding:1px 6px;border:1px solid var(--green);color:var(--green);">CLEAR</span>' : ''}
          ${isEndless ? '<span style="font-family:var(--font-main);font-size:0.5rem;letter-spacing:2px;padding:1px 6px;border:1px solid #ffffff;color:#ffffff;animation:pulse-glow 1.5s infinite;">ENDLESS</span>' : ''}
          ${isNew ? '<span style="font-family:var(--font-main);font-size:0.5rem;letter-spacing:2px;padding:1px 6px;border:1px solid #ffd700;color:#ffd700;animation:pulse-glow 1.5s infinite;">NEW</span>' : ''}
          <span style="font-family:var(--font-main);font-size:0.55rem;letter-spacing:2px;padding:2px 8px;border:1px solid ${diffColor};color:${diffColor};">${s.diff}</span>
        </div>
      </div>
      ${s.desc ? `<div style="font-size:0.62rem;color:#557;margin-bottom:8px;line-height:1.5;">${s.desc}</div>` : ''}
      <div class="stage-gimmick">▸ ${s.gimmick}</div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap;">
        <span class="stage-badge" style="border:1px solid #2a3050;color:#668;">${wavesLabel} WAVES</span>
        <span class="stage-badge" style="border:1px solid #2a3050;color:#668;">START: ${s.startMoney||150}C / ${s.startHp||20}HP</span>
        <span class="stage-badge" style="border:1px solid #2a3050;color:#668;">BOSS OVERDRIVE</span>
        <span class="stage-badge" style="border:1px solid ${s.color}44;color:${s.color}88;">PATH-${(s.pathId||0)+1}</span>
        ${bestWave > 0 ? `<span class="stage-badge" style="border:1px solid #ffd70044;color:#ffd700cc;">BEST WAVE ${bestWave}/${wavesLabel}</span>` : ''}
      </div>
    `;
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = s.color;
      card.style.boxShadow = `0 0 20px ${s.color}33`;
      card.style.transform = 'translateY(-3px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '';
      card.style.boxShadow = '';
      card.style.transform = '';
    });
    card.onclick = () => startBattle(s);
    c.appendChild(card);
  });
}

// ────────────────────────────────────────────────
//  PARTY SCREEN
// ────────────────────────────────────────────────
function renderParty() {
  // Slots
  const sc = document.getElementById('party-slots');
  sc.innerHTML = '';
  const maxParty = getMaxPartySize();
  const label = document.getElementById('party-slots-label');
  if (label) label.textContent = `ACTIVE SLOTS (MAX ${maxParty})`;
  for (let i = 0; i < maxParty; i++) {
    const cid = playerData.party[i];
    const slot = document.createElement('div');
    slot.className = 'party-slot' + (cid != null ? ' filled' : '');
    if (cid != null) {
      const ch = CHAR_TEMPLATES[cid];
      const rc = RARITY_COLORS[ch.rarity] || '#00e8ff';
      slot.style.borderColor = ch.color;
      slot.style.boxShadow = `0 0 15px ${ch.color}33`;
      slot.innerHTML = `
        <div style="font-family:var(--font-main);font-size:0.7rem;color:${ch.color};letter-spacing:1px;">${ch.name}</div>
        <div style="font-size:0.55rem;color:${rc};">${ch.rarity}</div>
        <div style="font-size:0.6rem;color:#557;">Base LV.${playerData.baseLevels[cid]}</div>
        <button class="slot-remove" onclick="removeParty(${i})">✕</button>
      `;
    } else {
      slot.innerHTML = `<div style="font-size:0.65rem;letter-spacing:2px;color:#2a3050;">EMPTY</div>`;
    }
    sc.appendChild(slot);
  }

  // Inventory
  const ic = document.getElementById('inventory-list');
  ic.innerHTML = '';
  CHAR_TEMPLATES.forEach(ch => {
    const unlocked = playerData.unlocked.includes(ch.id);
    const equipped = playerData.party.includes(ch.id);
    const card = document.createElement('div');
    card.className = 'char-card' + (equipped ? ' selected' : '') + (unlocked ? '' : ' locked');
    const rc = RARITY_COLORS[ch.rarity] || '#00e8ff';
    if (unlocked) {
      card.style.borderColor = equipped ? ch.color : '';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div class="char-card-name" style="color:${ch.color};">${ch.name}</div>
          <div style="font-family:var(--font-main);font-size:0.6rem;color:${rc};">${ch.rarity}</div>
        </div>
        <div class="char-card-type" style="color:${rc};">${ch.type}</div>
        <div class="char-card-stats">
          <div>ATK ${ch.damage}</div><div>RNG ${ch.range}</div>
          <div>CD ${ch.cooldown}</div><div>LV.${playerData.baseLevels[ch.id]}</div>
        </div>
        <div class="char-card-desc">${ch.desc}</div>
      `;
      card.onclick = () => addParty(ch.id);
    } else {
      card.innerHTML = `
        <div class="char-card-name" style="color:#223;">??????</div>
        <div style="font-size:0.65rem;color:${rc};letter-spacing:2px;margin-top:8px;">LOCKED</div>
        <div style="font-size:0.6rem;color:#1a2040;margin-top:4px;">${ch.type}</div>
      `;
    }
    ic.appendChild(card);
  });
}

function addParty(id) {
  if (!playerData.unlocked.includes(id) || playerData.party.includes(id)) return;
  const maxParty = getMaxPartySize();
  if (playerData.party.length >= maxParty) playerData.party.shift();
  playerData.party.push(id);
  renderParty();
  autoSave('party-add');
}

function removeParty(i) {
  playerData.party.splice(i, 1);
  renderParty();
  autoSave('party-remove');
}

// ────────────────────────────────────────────────
//  AUGMENT SCREEN（解放プロトコル：永続アップグレード）
// ────────────────────────────────────────────────
function renderAugments() {
  const c = document.getElementById('augment-list');
  if (!c) return;
  c.innerHTML = '';
  AUGMENT_TEMPLATES.forEach((a, idx) => {
    const lv = playerData.augments[idx] || 0;
    const maxed = lv >= a.maxLv;
    const cost = maxed ? null : getAugmentUpgradeCost(a, lv);
    const affordable = !maxed && playerData.crystals >= cost;
    const card = document.createElement('div');
    card.className = 'augment-card' + (lv > 0 ? ' unlocked' : '');
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="augment-icon">${a.icon}</span>
          <div>
            <div class="augment-name">${a.name}</div>
            <div class="augment-short">${a.short}</div>
          </div>
        </div>
        <div class="augment-lv-badge${maxed ? ' max' : ''}">${maxed ? 'MAX' : `LV.${lv}/${a.maxLv}`}</div>
      </div>
      <div class="augment-desc">${a.desc}</div>
      <div class="augment-effect">▸ ${a.effectText(lv)}</div>
      <button class="btn-augment" ${maxed || !affordable ? 'disabled' : ''} onclick="upgradeAugment(${idx})">
        ${maxed ? 'FULLY UNLOCKED' : (lv === 0 ? `UNLOCK ${cost}C` : `UPGRADE ${cost}C`)}
      </button>
    `;
    c.appendChild(card);
  });
}

function upgradeAugment(idx) {
  const a = AUGMENT_TEMPLATES[idx];
  if (!a) return;
  const lv = playerData.augments[idx] || 0;
  if (lv >= a.maxLv) return;
  const cost = getAugmentUpgradeCost(a, lv);
  if (playerData.crystals < cost) { alert("コア結晶が不足しています！"); return; }
  playerData.crystals -= cost;
  playerData.augments[idx] = lv + 1;
  updateMeta();
  renderAugments();
  autoSave('augment-upgrade');
}

// ────────────────────────────────────────────────
//  GACHA AUDIO — lightweight synthesized SFX (no external files)
// ────────────────────────────────────────────────
let gachaAudioCtx = null;
function getGachaAudioCtx() {
  if (!playerData.soundEnabled) return null;
  if (!gachaAudioCtx) {
    try { gachaAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  if (gachaAudioCtx.state === 'suspended') gachaAudioCtx.resume();
  return gachaAudioCtx;
}
function playTone(freq, duration, type, peak, delay) {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  type = type || 'sine'; peak = peak != null ? peak : 0.12; delay = delay || 0;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + duration + 0.05);
}
function playGachaWhoosh() {
  const ctx = getGachaAudioCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(80, t0);
  osc.frequency.exponentialRampToValueAtTime(620, t0 + 0.9);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(0.05, t0 + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + 1.0);
}
function playGachaTick() { playTone(880, 0.08, 'square', 0.045); }
function playGachaChime(rarity) {
  if (rarity === 'SSR') [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, 0.5, 'triangle', 0.09, i * 0.09));
  else if (rarity === 'SR') [523.25, 659.25, 783.99].forEach((f, i) => playTone(f, 0.4, 'triangle', 0.07, i * 0.08));
  else playTone(659.25, 0.25, 'sine', 0.06);
}
function toggleSound() {
  playerData.soundEnabled = !playerData.soundEnabled;
  syncSoundToggleUI();
  autoSave('sound-toggle');
}
function syncSoundToggleUI() {
  const btn = document.getElementById('sound-toggle-btn');
  if (!btn) return;
  btn.textContent = playerData.soundEnabled ? '🔊 SOUND' : '🔇 MUTED';
  btn.classList.toggle('muted', !playerData.soundEnabled);
}

// ────────────────────────────────────────────────
//  GACHA
// ────────────────────────────────────────────────
const GACHA_CHARGE_LINES = [
  'SIGNAL LOCKED...',
  'DECRYPTING CORE DATA...',
  'ACCESSING UNIT ARCHIVE...',
  'STABILIZING QUANTUM LINK...',
];

function rollGacha(count) {
  const cost = count === 1 ? 100 : 900;
  if (playerData.crystals < cost) { alert("コア結晶が不足しています！"); return; }
  playerData.crystals -= cost;
  updateMeta();

  const results = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let pool;
    if (roll < 0.03)      pool = CHAR_TEMPLATES.filter(c => c.rarity === 'SSR');
    else if (roll < 0.21) pool = CHAR_TEMPLATES.filter(c => c.rarity === 'SR');
    else                  pool = CHAR_TEMPLATES.filter(c => c.rarity === 'R');
    const ch = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !playerData.unlocked.includes(ch.id);
    if (isNew) playerData.unlocked.push(ch.id);
    else playerData.baseLevels[ch.id]++;
    results.push({ ch, isNew });
  }
  playGachaSequence(results);
  autoSave('gacha');
}

// ── 演出シーケンス：チャージ → フラッシュ／衝撃波 → (SSR時)スポットライト → カード開封 ──
function playGachaSequence(results) {
  const overlay     = document.getElementById('gacha-overlay');
  const chargeLabel = document.getElementById('gacha-charge-label');
  const closeBtn    = document.getElementById('gacha-close-btn');
  if (!overlay) { revealResults(results); return; } // defensive fallback

  const bestRarity = results.some(r => r.ch.rarity === 'SSR') ? 'SSR'
                    : results.some(r => r.ch.rarity === 'SR')  ? 'SR' : 'R';

  // reset overlay to a clean charging state (force reflow so repeated rolls replay animations)
  overlay.classList.remove('show', 'phase-charge', 'phase-flash', 'phase-spotlight', 'phase-reveal', 'shaking');
  void overlay.offsetWidth;
  overlay.classList.add('show', 'phase-charge');
  document.getElementById('gacha-multi-results').innerHTML = '';
  document.getElementById('gacha-stars').innerHTML = '';
  document.getElementById('gacha-tally').innerHTML = '';
  document.getElementById('gacha-result-bg').innerHTML = '';
  if (closeBtn) closeBtn.classList.remove('visible');

  playGachaWhoosh();
  let lineIdx = 0;
  if (chargeLabel) chargeLabel.textContent = GACHA_CHARGE_LINES[0];
  const lineTimer = setInterval(() => {
    lineIdx = (lineIdx + 1) % GACHA_CHARGE_LINES.length;
    if (chargeLabel) chargeLabel.textContent = GACHA_CHARGE_LINES[lineIdx];
  }, 260);

  const chargeDuration = bestRarity === 'SSR' ? 1500 : (results.length > 1 ? 1200 : 950);

  setTimeout(() => {
    clearInterval(lineTimer);
    overlay.classList.remove('phase-charge');
    overlay.classList.add('phase-flash');
    triggerGachaFlash(bestRarity);
    triggerGachaShockwave(bestRarity);
    triggerGachaShake(overlay, bestRarity === 'SSR' ? 14 : bestRarity === 'SR' ? 8 : 4);

    setTimeout(() => {
      if (bestRarity === 'SSR') {
        const ssrResult = results.find(r => r.ch.rarity === 'SSR');
        overlay.classList.remove('phase-flash');
        overlay.classList.add('phase-spotlight');
        renderGachaSpotlight(ssrResult);
        playGachaChime('SSR');
        setTimeout(() => {
          overlay.classList.remove('phase-spotlight');
          overlay.classList.add('phase-reveal');
          revealResults(results);
        }, 1600);
      } else {
        overlay.classList.remove('phase-flash');
        overlay.classList.add('phase-reveal');
        playGachaChime(bestRarity);
        revealResults(results);
      }
    }, 380);
  }, chargeDuration);
}

function triggerGachaFlash(rarity) {
  const flashEl = document.getElementById('gacha-flash');
  if (!flashEl) return;
  const color = rarity === 'SSR' ? '255,215,0' : rarity === 'SR' ? '204,68,255' : '0,232,255';
  flashEl.style.background = `radial-gradient(circle, rgba(${color},${rarity==='SSR'?0.55:0.3}), transparent 70%)`;
  flashEl.style.animation = 'none';
  void flashEl.offsetWidth;
  flashEl.style.animation = `gachaFlash ${rarity==='SSR'?0.9:0.5}s ease-out forwards`;
}

function triggerGachaShockwave(rarity) {
  const shockEl = document.getElementById('gacha-shockwave');
  if (!shockEl) return;
  const color = rarity === 'SSR' ? '#ffd700' : rarity === 'SR' ? '#cc44ff' : '#00e8ff';
  shockEl.style.borderColor = color;
  shockEl.style.animation = 'none';
  void shockEl.offsetWidth;
  shockEl.style.animation = `gachaShockwave ${rarity==='SSR'?1.1:0.8}s ease-out forwards`;
}

function triggerGachaShake(el, intensity) {
  el.style.setProperty('--shake-intensity', intensity + 'px');
  el.classList.remove('shaking');
  void el.offsetWidth;
  el.classList.add('shaking');
  setTimeout(() => el.classList.remove('shaking'), 420);
}

function renderGachaSpotlight(result) {
  const { ch } = result;
  const card   = document.getElementById('gacha-spotlight-card');
  const banner = document.getElementById('gacha-spotlight-banner');
  if (card) card.innerHTML = `
    <div class="spotlight-glyph" style="color:${ch.color};text-shadow:0 0 30px ${ch.color};">${ch.name[0]}</div>
    <div class="spotlight-name" style="color:${ch.color};text-shadow:0 0 20px ${ch.color};">${ch.name}</div>
    <div class="spotlight-type">${ch.type}</div>
  `;
  if (banner) banner.textContent = '⚠ OVERDRIVE UNIT DETECTED ⚠';
  const starsEl = document.getElementById('gacha-stars');
  if (starsEl) for (let i = 0; i < 50; i++) spawnGachaStar(starsEl, ['#ffd700', '#ffee88', '#ffffff'], true);
}

function spawnGachaStar(container, colors, big) {
  const s = document.createElement('div');
  s.className = 'gacha-star' + (big ? ' big' : '');
  const angle = Math.random() * 360;
  const dist  = big ? 100 + Math.random() * 260 : 50 + Math.random() * 200;
  const tx = Math.cos(angle * Math.PI / 180) * dist;
  const ty = Math.sin(angle * Math.PI / 180) * dist;
  const color = colors[Math.floor(Math.random() * colors.length)];
  s.style.cssText = `
    left:50%;top:50%;
    background:${color};
    --tx:${tx}px;--ty:${ty}px;
    animation-delay:${Math.random() * 0.5}s;
    animation-duration:${1 + Math.random()}s;
    ${big ? `box-shadow:0 0 12px 2px ${color};` : ''}
  `;
  container.appendChild(s);
}

// ── 結果カードの本開封（3Dフリップ演出 + レアリティ集計）──
function revealResults(results) {
  const container = document.getElementById('gacha-multi-results');
  const starsEl    = document.getElementById('gacha-stars');
  const closeBtn   = document.getElementById('gacha-close-btn');
  container.innerHTML = '';
  starsEl.innerHTML = '';

  const highValue = results.some(r => r.ch.rarity === 'SSR');
  const starCount = highValue ? 70 : 34;
  const starColors = results.map(r => r.ch.color);
  for (let i = 0; i < starCount; i++) spawnGachaStar(starsEl, starColors, false);

  results.forEach((r, idx) => {
    const { ch, isNew } = r;
    const rc = RARITY_COLORS[ch.rarity] || '#00e8ff';
    const flip = document.createElement('div');
    flip.className = 'gacha-card-flip' + (results.length > 1 ? ' multi' : '');
    flip.style.animationDelay = (idx * 0.15) + 's';
    flip.innerHTML = `
      <div class="gacha-card-inner" style="animation-delay:${idx * 0.15 + 0.3}s;">
        <div class="gacha-card-back">
          <div class="gacha-card-back-glyph">?</div>
        </div>
        <div class="gacha-card-front${ch.rarity==='SSR' ? ' is-ssr' : ''}" style="border-color:${rc};box-shadow:0 0 ${ch.rarity==='SSR'?40:20}px ${rc}${ch.rarity==='SSR'?'88':'44'};">
          <div class="gacha-result-rarity" style="color:${rc};text-shadow:0 0 10px ${rc};">
            ${'★'.repeat(ch.rarity==='SSR'?3:ch.rarity==='SR'?2:1)} ${ch.rarity} ${'★'.repeat(ch.rarity==='SSR'?3:ch.rarity==='SR'?2:1)}
          </div>
          <div class="gacha-result-name" style="color:${ch.color};text-shadow:0 0 15px ${ch.color};">${ch.name}</div>
          <div class="gacha-result-type" style="color:${rc};">${ch.type}</div>
          ${results.length === 1 ? `<div class="gacha-result-desc">${ch.desc}</div>` : ''}
          <div class="gacha-result-status" style="color:${isNew?'var(--green)':'var(--orange)'};border-color:${isNew?'var(--green)':'var(--orange)'};text-shadow:0 0 10px ${isNew?'var(--green)':'var(--orange)'};font-size:${results.length>1?'0.7':'0.85'}rem;">
            ${isNew ? 'NEW UNLOCK' : 'LIMIT BREAK'}
          </div>
          ${!isNew && results.length===1 ? `<div style="font-size:0.65rem;color:#557;margin-top:8px;">BaseLV → ${playerData.baseLevels[ch.id]}</div>` : ''}
        </div>
      </div>
    `;
    container.appendChild(flip);
    setTimeout(() => playGachaTick(), idx * 150 + 300);
  });

  // Beam
  const beam = document.createElement('div');
  beam.className = 'gacha-result-beam';
  beam.style.background = `linear-gradient(180deg,transparent,${results[0].ch.color},transparent)`;
  document.getElementById('gacha-result-bg').innerHTML = '';
  document.getElementById('gacha-result-bg').appendChild(beam);

  // 10連の場合はレアリティ内訳を表示
  const tally = document.getElementById('gacha-tally');
  if (tally) {
    if (results.length > 1) {
      const counts = { SSR: 0, SR: 0, R: 0 };
      results.forEach(r => counts[r.ch.rarity]++);
      tally.innerHTML = `
        ${counts.SSR ? `<span class="tally-chip ssr">SSR ×${counts.SSR}</span>` : ''}
        ${counts.SR  ? `<span class="tally-chip sr">SR ×${counts.SR}</span>` : ''}
        ${counts.R   ? `<span class="tally-chip r">R ×${counts.R}</span>` : ''}
      `;
    } else {
      tally.innerHTML = '';
    }
  }

  if (closeBtn) setTimeout(() => closeBtn.classList.add('visible'), results.length * 150 + 500);
}

function closeGachaOverlay() {
  document.getElementById('gacha-overlay').classList.remove('show', 'phase-charge', 'phase-flash', 'phase-spotlight', 'phase-reveal', 'shaking');
  updateMeta();
}

// ════════════════════════════════════════════════════════════
//  SAVE / LOAD  ─  LOCAL  +  CLOUD
//
//  [ゲスト]   autoSave → localStorage のみ
//  [ログイン] autoSave → localStorage + Firestore
//  [ログイン時] loadFromCloud が呼ばれ、
//              ゲストデータとクラウドデータを比較・選択
// ════════════════════════════════════════════════════════════

const LOCAL_SAVE_KEY = 'neonDefenseSave';

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  let t = document.getElementById('save-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'save-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Serialize ────────────────────────────────────────────────
function serializePlayerData() {
  return {
    crystals:   playerData.crystals,
    baseLevels: [...playerData.baseLevels],
    unlocked:   [...playerData.unlocked],
    party:      [...playerData.party],
    stageBestWave: [...playerData.stageBestWave],
    stageCleared:  [...playerData.stageCleared],
    augments:      [...playerData.augments],
    soundEnabled:  playerData.soundEnabled,
    savedAt:    new Date().toISOString()
  };
}

// ── Apply saved snapshot → playerData ────────────────────────
function applyCloudData(data) {
  if (!data) return;
  if (typeof data.crystals === 'number')  playerData.crystals   = data.crystals;
  if (Array.isArray(data.baseLevels)) {
    playerData.baseLevels = [...data.baseLevels];
    // 新キャラ追加後のセーブデータへ対応
    while (playerData.baseLevels.length < CHAR_TEMPLATES.length)
      playerData.baseLevels.push(1);
  }
  if (Array.isArray(data.unlocked)) playerData.unlocked = [...data.unlocked];
  if (Array.isArray(data.party))    playerData.party    = [...data.party];
  if (Array.isArray(data.stageBestWave)) {
    playerData.stageBestWave = [...data.stageBestWave];
    while (playerData.stageBestWave.length < STAGE_TEMPLATES.length) playerData.stageBestWave.push(0);
  }
  if (Array.isArray(data.stageCleared)) {
    playerData.stageCleared = [...data.stageCleared];
    while (playerData.stageCleared.length < STAGE_TEMPLATES.length) playerData.stageCleared.push(false);
  }
  if (Array.isArray(data.augments)) {
    playerData.augments = [...data.augments];
    while (playerData.augments.length < AUGMENT_TEMPLATES.length) playerData.augments.push(0);
  }
  if (typeof data.soundEnabled === 'boolean') playerData.soundEnabled = data.soundEnabled;
  // SQUAD EXPANSION未解放時にパーティー人数が上限を超えている場合は切り詰める
  const maxParty = getMaxPartySize();
  if (playerData.party.length > maxParty) playerData.party = playerData.party.slice(0, maxParty);
  updateMeta();
  const activeId = document.querySelector('.screen.active')?.id;
  if (activeId === 'screen-party') renderParty();
  if (activeId === 'screen-stage') renderStages();
  if (activeId === 'screen-augment') renderAugments();
  if (activeId === 'screen-gacha') syncSoundToggleUI();
}

// ── ローカル保存（全員共通）──────────────────────────────────
function saveLocal() {
  try {
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(serializePlayerData()));
  } catch(e) { console.warn('[LocalSave] 失敗:', e); }
}

// ── ローカルデータ取得 ───────────────────────────────────────
function getLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(_) { return null; }
}

// ── ゲストプレイの痕跡があるか ───────────────────────────────
// 初期値と同じなら「何もしていない」とみなしてダイアログを出さない
function hasGuestProgress(data) {
  if (!data) return false;
  if (data.crystals !== 600)                                   return true;
  if ((data.unlocked?.length  ?? 0) > 2)                      return true;
  if ((data.baseLevels ?? []).some((lv, i) => i > 1 && lv > 1)) return true;
  return false;
}

// ── 起動時にローカルデータを適用（loader.js から呼び出す）────
window.applyLocalSaveOnBoot = function() {
  const local = getLocalData();
  if (local) applyCloudData(local);
};

// ════════════════════════════════════════════════════════════
//  DATA MIGRATION DIALOG
// ════════════════════════════════════════════════════════════
function showMigrateDialog(uid, localData, cloudData) {
  return new Promise(resolve => {
    document.getElementById('_migrate-dialog')?.remove();

    const fmtDate = iso => {
      if (!iso) return '不明';
      const d = new Date(iso);
      return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    };

    const wrap = document.createElement('div');
    wrap.id = '_migrate-dialog';
    wrap.style.cssText = `
      position:fixed;inset:0;z-index:99999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,10,0.92);
      backdrop-filter:blur(10px);
    `;

    wrap.innerHTML = `
      <style>
        #_migrate-dialog .mg-panel {
          background:linear-gradient(135deg,rgba(4,6,20,0.99),rgba(8,4,24,0.99));
          border:1px solid #cc44ff;
          box-shadow:0 0 60px #cc44ff33,inset 0 0 40px rgba(204,68,255,0.03);
          padding:38px 32px 30px;
          max-width:500px;width:92%;
          font-family:var(--font-sub,'Share Tech Mono',monospace);
          color:#aab;position:relative;
        }
        #_migrate-dialog .mg-corner {
          position:absolute;width:12px;height:12px;border-color:#cc44ff;border-style:solid;
        }
        #_migrate-dialog .mg-corner.tl{top:10px;left:10px;border-width:1px 0 0 1px;}
        #_migrate-dialog .mg-corner.tr{top:10px;right:10px;border-width:1px 1px 0 0;}
        #_migrate-dialog .mg-corner.bl{bottom:10px;left:10px;border-width:0 0 1px 1px;}
        #_migrate-dialog .mg-corner.br{bottom:10px;right:10px;border-width:0 1px 1px 0;}
        #_migrate-dialog .mg-title {
          font-family:var(--font-main,'Orbitron',sans-serif);
          font-size:0.88rem;letter-spacing:4px;color:#cc44ff;margin-bottom:4px;
        }
        #_migrate-dialog .mg-sub {
          font-size:0.62rem;letter-spacing:1px;color:#445;
          line-height:1.7;margin-bottom:24px;
        }
        #_migrate-dialog .mg-cards {
          display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;
        }
        #_migrate-dialog .mg-card {
          padding:16px 14px;border-radius:2px;
        }
        #_migrate-dialog .mg-card-cloud { border:1px solid #cc44ff55;background:rgba(204,68,255,0.05); }
        #_migrate-dialog .mg-card-local { border:1px solid #00e8ff55;background:rgba(0,232,255,0.05); }
        #_migrate-dialog .mg-card-lbl {
          font-size:0.52rem;letter-spacing:3px;margin-bottom:10px;font-family:var(--font-main,'Orbitron',sans-serif);
        }
        #_migrate-dialog .mg-row { font-size:0.65rem;color:#667;line-height:2.1; }
        #_migrate-dialog .mg-row b { color:#ffd700;font-weight:normal; }
        #_migrate-dialog .mg-row-date { font-size:0.53rem;color:#334;margin-top:6px; }
        #_migrate-dialog .mg-btn {
          width:100%;font-family:var(--font-main,'Orbitron',sans-serif);
          font-size:0.62rem;letter-spacing:2px;padding:14px 10px;
          cursor:pointer;transition:all .18s;border-radius:1px;
          margin-bottom:10px;
        }
        #_migrate-dialog .mg-btn:last-of-type { margin-bottom:0; }
        #_migrate-dialog .mg-btn:hover { transform:translateY(-2px);filter:brightness(1.25); }
        #_migrate-dialog .mg-btn-local {
          border:1px solid #00e8ff;background:rgba(0,232,255,0.07);color:#00e8ff;
        }
        #_migrate-dialog .mg-btn-cloud {
          border:1px solid #cc44ff;background:rgba(204,68,255,0.07);color:#cc44ff;
        }
        #_migrate-dialog .mg-note {
          font-size:0.55rem;color:#334;text-align:center;
          margin-top:14px;line-height:1.8;
        }
      </style>

      <div class="mg-panel">
        <div class="mg-corner tl"></div><div class="mg-corner tr"></div>
        <div class="mg-corner bl"></div><div class="mg-corner br"></div>

        <div class="mg-title">◈ DATA SYNC CONFLICT</div>
        <div class="mg-sub">
          クラウドに既存のデータが見つかりました。<br>
          ゲストプレイ中のローカルデータと、どちらを使用しますか？
        </div>

        <div class="mg-cards">
          <div class="mg-card mg-card-cloud">
            <div class="mg-card-lbl" style="color:#cc44ff;">☁ CLOUD DATA</div>
            <div class="mg-row">CRYSTA  <b>${cloudData?.crystals ?? '—'}</b></div>
            <div class="mg-row">UNITS   <b>${cloudData?.unlocked?.length ?? '—'}</b></div>
            <div class="mg-row-date">${fmtDate(cloudData?.savedAt)}</div>
          </div>
          <div class="mg-card mg-card-local">
            <div class="mg-card-lbl" style="color:#00e8ff;">◉ LOCAL DATA</div>
            <div class="mg-row">CRYSTA  <b>${localData?.crystals ?? '—'}</b></div>
            <div class="mg-row">UNITS   <b>${localData?.unlocked?.length ?? '—'}</b></div>
            <div class="mg-row-date">${fmtDate(localData?.savedAt)}</div>
          </div>
        </div>

        <button class="mg-btn mg-btn-local" id="_mg-btn-local">
          ▶ ローカルデータをクラウドに移して使う
        </button>
        <button class="mg-btn mg-btn-cloud" id="_mg-btn-cloud">
          ▶ クラウドデータを使う（ローカルを破棄）
        </button>

        <div class="mg-note">
          「ローカルを使う」を選ぶとクラウドの既存データは上書きされます。<br>
          「クラウドを使う」を選ぶとローカルデータは消去されます。
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    // ── ローカルを選択：クラウドへ移行して適用 ──────────────
    document.getElementById('_mg-btn-local').onclick = async () => {
      wrap.remove();
      try {
        const payload = { ...localData, savedAt: new Date().toISOString() };
        await window._saveData(uid, payload);
        applyCloudData(payload);
        saveLocal();
        showToast('ローカルデータをクラウドに移行しました ✓');
      } catch(e) {
        showToast('移行に失敗しました: ' + e.message, true);
        applyCloudData(localData); // 失敗してもローカルは活かす
      }
      resolve('local');
    };

    // ── クラウドを選択：ローカルを上書き ────────────────────
    document.getElementById('_mg-btn-cloud').onclick = () => {
      wrap.remove();
      applyCloudData(cloudData);
      saveLocal(); // クラウドデータをローカルにも書き込む
      showToast('クラウドデータを読み込みました');
      resolve('cloud');
    };
  });
}

// ════════════════════════════════════════════════════════════
//  GOOGLE AUTH & CLOUD SAVE
// ════════════════════════════════════════════════════════════

// ── Auth state callback（Firebase module から呼ばれる）──────
window.onAuthChanged = function(user) {
  const btn      = document.getElementById('auth-btn');
  const saveWrap = document.getElementById('auth-save-wrap');
  const btnLabel = document.getElementById('auth-btn-label');
  const btnIcon  = document.getElementById('auth-btn-icon');
  const userName = document.getElementById('auth-user-name');

  if (user) {
    btn.classList.add('logged-in');
    btnIcon.textContent  = '✕';
    btnLabel.textContent = 'LOGOUT';
    saveWrap.style.display = 'flex';
    userName.textContent   = user.displayName || user.email || 'USER';

    // ログイン時：ローカル vs クラウドを照合
    loadFromCloud(user.uid);
    startAutoSaveInterval();
  } else {
    btn.classList.remove('logged-in');
    btnIcon.textContent  = '⬡';
    btnLabel.textContent = 'GOOGLE LOGIN';
    saveWrap.style.display = 'none';
    userName.textContent   = '';
    stopAutoSaveInterval();
  }
};

// ── Login / Logout button ────────────────────────────────────
window.handleAuthBtn = function() {
  if (window._currentUser) {
    window._googleLogout();
  } else {
    if (typeof window._googleLogin === 'function') {
      window._googleLogin();
    } else {
      showToast('Firebase not configured yet', true);
    }
  }
};

// ── 手動 Save ─────────────────────────────────────────────────
window.saveToCloud = async function() {
  const user = window._currentUser;
  if (!user) { showToast('ログインが必要です', true); return; }
  if (typeof window._saveData !== 'function') { showToast('Firebase not configured', true); return; }

  const btn = document.getElementById('save-btn');
  btn.classList.add('saving');
  btn.textContent = 'SAVING...';

  try {
    await window._saveData(user.uid, serializePlayerData());
    saveLocal();
    btn.classList.remove('saving');
    btn.classList.add('saved');
    btn.textContent = '✓ SAVED';
    showToast('クラウドにデータを保存しました');
    setTimeout(() => {
      btn.classList.remove('saved');
      btn.textContent = 'SAVE';
    }, 2000);
  } catch(e) {
    btn.classList.remove('saving');
    btn.textContent = 'SAVE';
    showToast('保存に失敗しました: ' + e.message, true);
  }
};

// ── Auto-save ─────────────────────────────────────────────────
// ① 常にローカルへ保存（ゲスト・ログイン問わず）
// ② ログイン中ならクラウドにも保存
let _autoSaveTimer = null;

async function autoSave(reason) {
  // ① ローカル保存（常時）
  saveLocal();

  // ② クラウド保存（ログイン時のみ）
  const user = window._currentUser;
  if (!user || typeof window._saveData !== 'function') return;
  try {
    await window._saveData(user.uid, serializePlayerData());
    console.log('[AutoSave]', reason);
    const btn = document.getElementById('save-btn');
    if (btn) {
      btn.classList.add('saved');
      btn.textContent = '✓ AUTO';
      clearTimeout(btn._autoTid);
      btn._autoTid = setTimeout(() => {
        btn.classList.remove('saved');
        btn.textContent = 'SAVE';
      }, 1500);
    }
  } catch(e) {
    showToast('自動保存に失敗: ' + e.message, true);
  }
}

function startAutoSaveInterval() {
  clearInterval(_autoSaveTimer);
  _autoSaveTimer = setInterval(() => autoSave('interval-30s'), 30000);
}
function stopAutoSaveInterval() {
  clearInterval(_autoSaveTimer);
}

// ページを離れる / タブを隠す際にも保存
window.addEventListener('beforeunload', () => {
  saveLocal(); // ゲスト含む全員
  if (!window._currentUser || typeof window._saveData !== 'function') return;
  try { window._saveData(window._currentUser.uid, serializePlayerData()); } catch(_) {}
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') autoSave('tab-hidden');
});

// ── Load from Firestore（ログイン直後に呼ばれる）────────────
async function loadFromCloud(uid) {
  if (typeof window._loadData !== 'function') return;
  try {
    const cloudData = await window._loadData(uid);
    const localData = getLocalData();
    const guestHasProgress = hasGuestProgress(localData);

    // ── Case A: クラウドにデータなし ──────────────────────
    if (!cloudData) {
      if (guestHasProgress) {
        // ゲストデータを自動でクラウドへ移行（確認不要）
        const payload = { ...localData, savedAt: new Date().toISOString() };
        await window._saveData(uid, payload);
        applyCloudData(payload);
        saveLocal();
        showToast('ゲストデータをクラウドに移行しました ✓');
      } else {
        showToast('クラウドデータなし — 現在のデータで開始します');
      }
      return;
    }

    // ── Case B: クラウドにデータあり ──────────────────────
    if (guestHasProgress) {
      // ゲストプレイのデータがある → ダイアログで選ばせる
      await showMigrateDialog(uid, localData, cloudData);
    } else {
      // ゲストプレイなし → クラウドをそのまま適用
      applyCloudData(cloudData);
      saveLocal();
      const d = new Date(cloudData.savedAt);
      const dateStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
      showToast(`データをロードしました (${dateStr})`);
    }
  } catch(e) {
    showToast('ロード失敗: ' + e.message, true);
  }
}
