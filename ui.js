/* ============================================================
   NEON DEFENSE: OVERDRIVE III — ui.js
   ============================================================ */

let gameState = null;
let animFrameId = null;

// ────────────────────────────────────────────────
//  DEVELOPER CONSOLE（開発者専用の隠しデバッグ機能）
//  有効化: タイトル画面のバージョン表記を7回連続タップ、
//         または URL に ?dev を付けてアクセス（localStorageに保持）
//  ※FABボタンは表示されない。発見できる要素は残さない。
// ────────────────────────────────────────────────
const DEV_MODE_KEY = 'neonDefenseDevMode';
let devMode = false;
let devPanelOpen = false;
let devTapCount = 0;
let devTapTimer = null;

try {
  const params = new URLSearchParams(window.location.search);
  if (params.has('dev') || localStorage.getItem(DEV_MODE_KEY) === '1') devMode = true;
} catch (e) { /* localStorage/URL unavailable — dev mode simply stays off */ }

function handleVersionTap() {
  devTapCount++;
  clearTimeout(devTapTimer);
  devTapTimer = setTimeout(() => { devTapCount = 0; }, 3000);
  if (devTapCount >= 7) {
    devTapCount = 0;
    clearTimeout(devTapTimer);
    toggleDevMode();
  } else if (devTapCount >= 4) {
    showToast(`DEVELOPER MODEまであと ${7 - devTapCount} 回タップ`);
  }
}

function toggleDevMode() {
  devMode = !devMode;
  try { localStorage.setItem(DEV_MODE_KEY, devMode ? '1' : '0'); } catch (e) {}
  applyDevModeUI();
  showToast(devMode ? '🛠 DEVELOPER MODE ENABLED' : 'DEVELOPER MODE DISABLED');
}

function applyDevModeUI() {
  // FABボタンは常に非表示 — 開発者モードでも画面に出さない
  const fab = document.getElementById('dev-fab');
  if (fab) fab.style.display = 'none';
  if (!devMode) {
    devPanelOpen = false;
    const overlay = document.getElementById('dev-panel-overlay');
    if (overlay) overlay.classList.remove('show');
  }
}
applyDevModeUI();

// F9でも開閉できる（開発者用キーボードショートカット）
window.addEventListener('keydown', e => {
  if (e.key === 'F9' && devMode) { e.preventDefault(); toggleDevPanel(); }
});

function toggleDevPanel() {
  if (!devMode) return;
  const overlay = document.getElementById('dev-panel-overlay');
  if (!overlay) return;
  devPanelOpen = !overlay.classList.contains('show');
  overlay.classList.toggle('show', devPanelOpen);
  if (devPanelOpen) renderDevPanel();
}

function renderDevPanel() {
  const body = document.getElementById('dev-panel-body');
  if (!body) return;
  const inBattle = !!(gameState && gameState.state === 'playing');
  body.innerHTML = `
    <div class="dev-section">
      <div class="dev-section-title">CURRENCY（ガチャ用コア結晶）</div>
      <div class="dev-btn-row">
        <button class="dev-btn" onclick="devAddCrystals(1000)">+1,000</button>
        <button class="dev-btn" onclick="devAddCrystals(10000)">+10,000</button>
        <button class="dev-btn" onclick="devAddCrystals(100000)">+100,000</button>
        <button class="dev-btn gold" onclick="devMaxCrystals()">MAX (999,999)</button>
      </div>
      <div class="dev-current">現在のコア結晶: <b>${playerData.crystals}</b></div>
    </div>

    <div class="dev-section">
      <div class="dev-section-title">PROGRESSION</div>
      <div class="dev-btn-row">
        <button class="dev-btn" onclick="devUnlockAllUnits()">全ユニット解放</button>
        <button class="dev-btn" onclick="devMaxAllBaseLevels()">全ユニットLIMIT BREAK</button>
        <button class="dev-btn" onclick="devMaxAllAugments()">全プロトコルMAX</button>
        <button class="dev-btn danger" onclick="devResetStageRecords()">ステージ記録リセット</button>
      </div>
    </div>

    <div class="dev-section">
      <div class="dev-section-title">BATTLE${inBattle ? '' : ' <span class="dev-inactive-tag">戦闘中のみ有効</span>'}</div>
      <div class="dev-btn-row">
        <button class="dev-btn" ${inBattle ? '' : 'disabled'} onclick="devAddCredits(1000)">+1,000C</button>
        <button class="dev-btn" ${inBattle ? '' : 'disabled'} onclick="devAddCredits(10000)">+10,000C</button>
        <button class="dev-btn" ${inBattle ? '' : 'disabled'} onclick="devSetHP(999)">HP → 999</button>
        <button class="dev-btn${devState.godMode ? ' active' : ''}" ${inBattle ? '' : 'disabled'} onclick="devToggleGodMode()">GOD MODE: ${devState.godMode ? 'ON' : 'OFF'}</button>
        <button class="dev-btn" ${inBattle ? '' : 'disabled'} onclick="devKillAllEnemies()">全敵撃破</button>
        <button class="dev-btn" ${inBattle ? '' : 'disabled'} onclick="devForceNextWave()">次ウェーブへ</button>
        <button class="dev-btn danger" ${inBattle ? '' : 'disabled'} onclick="devInstantWin()">ステージ即勝利</button>
      </div>
    </div>

    <div class="dev-section">
      <div class="dev-section-title">SAVE DATA</div>
      <div class="dev-btn-row">
        <button class="dev-btn" onclick="devExportSave()">セーブをコピー</button>
        <button class="dev-btn" onclick="devImportSave()">セーブを読込</button>
        <button class="dev-btn danger" onclick="devResetAllData()">全データ初期化</button>
      </div>
    </div>
  `;
}

// ── Currency / Progression cheats ──
function devAddCrystals(amount) {
  playerData.crystals += amount;
  updateMeta();
  if (devPanelOpen) renderDevPanel();
  autoSave('dev-cheat');
}
function devMaxCrystals() {
  playerData.crystals = 999999;
  updateMeta();
  if (devPanelOpen) renderDevPanel();
  autoSave('dev-cheat');
}
function devUnlockAllUnits() {
  playerData.unlocked = CHAR_TEMPLATES.map(c => c.id);
  if (document.getElementById('screen-party')?.classList.contains('active')) renderParty();
  showToast('全ユニットを解放しました');
  autoSave('dev-cheat');
}
function devMaxAllBaseLevels() {
  playerData.baseLevels = playerData.baseLevels.map(() => 20);
  if (document.getElementById('screen-party')?.classList.contains('active')) renderParty();
  showToast('全ユニットをLIMIT BREAKしました');
  autoSave('dev-cheat');
}
function devMaxAllAugments() {
  AUGMENT_TEMPLATES.forEach((a, idx) => { playerData.augments[idx] = a.maxLv; });
  if (document.getElementById('screen-augment')?.classList.contains('active')) renderAugments();
  showToast('全プロトコルを最大解放しました');
  autoSave('dev-cheat');
}
function devResetStageRecords() {
  if (!confirm("ステージ記録（最高到達ウェーブ／クリア済みフラグ）をすべてリセットしますか？")) return;
  playerData.stageBestWave = playerData.stageBestWave.map(() => 0);
  playerData.stageCleared  = playerData.stageCleared.map(() => false);
  if (document.getElementById('screen-stage')?.classList.contains('active')) renderStages();
  showToast('ステージ記録をリセットしました');
  autoSave('dev-cheat');
}

// ── Save data tools ──
function devExportSave() {
  const json = JSON.stringify(serializePlayerData(), null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(json)
      .then(() => showToast('セーブデータをクリップボードにコピーしました'))
      .catch(() => window.prompt('コピーに失敗しました。手動でコピーしてください:', json));
  } else {
    window.prompt('セーブデータ(JSON) — コピーしてください:', json);
  }
}
function devImportSave() {
  const input = window.prompt('セーブデータ(JSON)を貼り付けてください:');
  if (!input) return;
  try {
    const data = JSON.parse(input);
    applyCloudData(data);
    autoSave('dev-import');
    showToast('セーブデータを読み込みました');
  } catch (e) {
    alert('JSONの解析に失敗しました: ' + e.message);
  }
}
function devResetAllData() {
  if (!confirm("本当に全セーブデータを初期化しますか？この操作は取り消せません。")) return;
  try { localStorage.removeItem(LOCAL_SAVE_KEY); } catch (e) {}
  playerData.crystals      = 600;
  playerData.baseLevels    = CHAR_TEMPLATES.map(() => 1);
  playerData.unlocked      = [0, 1];
  playerData.party         = [0, 1];
  playerData.stageBestWave = STAGE_TEMPLATES.map(() => 0);
  playerData.stageCleared  = STAGE_TEMPLATES.map(() => false);
  playerData.augments      = AUGMENT_TEMPLATES.map(() => 0);
  playerData.enemyKills    = {};
  playerData.materials     = {};
  playerData.settings      = { lightMode:false, effectLevel:'high', autoSkip:false };
  applySettingsGlobal();
  playerData.soundEnabled  = true;
  updateMeta();
  switchScreen('title');
  showToast('セーブデータを初期化しました');
}

// ────────────────────────────────────────────────
//  TITLE
// ────────────────────────────────────────────────
function initTitle() {
  const cont = document.getElementById('title-hexagons');
  if (cont && cont.children.length === 0) {
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
  const tsChars = document.getElementById('ts-chars');
  if (tsChars) tsChars.textContent = CHAR_TEMPLATES.length;
  const tsStages = document.getElementById('ts-stages');
  if (tsStages) tsStages.textContent = STAGE_TEMPLATES.length;
  const tsEnemies = document.getElementById('ts-enemies');
  if (tsEnemies) tsEnemies.textContent = ENEMY_CATALOG.length;
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
  if (id === 'archive') renderArchive();
  if (id === 'forge') renderForge();
  if (id === 'config') renderConfig();
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
        ${(() => { const d = (typeof STAGE_DROP_TABLE !== 'undefined') ? STAGE_DROP_TABLE.find(e => e.stage === s.id) : null; return d ? `<span class="stage-badge" style="border:1px solid #ffd70066;color:#ffd700cc;" title="クリア時に低確率でドロップ">⚑ DROP: ${CHAR_TEMPLATES[d.unitId].name}</span>` : ''; })()}
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
//  PARTY SCREEN + UNIT PREVIEW（回転プレビュー）
// ────────────────────────────────────────────────
function renderParty() {
  // Slots
  const sc = document.getElementById('party-slots');
  sc.innerHTML = '';
  const maxParty = getMaxPartySize();
  const label = document.getElementById('party-slots-label');
  if (label) label.textContent = `ACTIVE SLOTS (MAX ${maxParty}) — カードをタップしてプレビュー`;
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
        <button class="slot-remove" onclick="event.stopPropagation();removeParty(${i})">✕</button>
      `;
      slot.style.cursor = 'pointer';
      slot.onclick = () => openUnitPreview(cid);
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
        <div class="char-card-type" style="color:${rc};">${ch.type}${equipped ? ' — EQUIPPED' : ''}</div>
        <div class="char-card-stats">
          <div>ATK ${getEffectiveAtk(ch)}</div><div>RNG ${ch.range}</div>
          <div>CD ${ch.cooldown}</div><div>LV.${playerData.baseLevels[ch.id]}</div>
        </div>
        <div class="char-card-desc">${ch.desc}</div>
      `;
      card.onclick = () => openUnitPreview(ch.id);
    } else {
      card.innerHTML = `
        <div class="char-card-name" style="color:#223;">??????</div>
        <div style="font-size:0.65rem;color:${rc};letter-spacing:2px;margin-top:8px;">LOCKED</div>
        <div style="font-size:0.6rem;color:#1a2040;margin-top:4px;">${ch.drop ? '⚑ STAGE DROP' : ch.type}</div>
      `;
    }
    ic.appendChild(card);
  });
}

// ── 実効ステータス計算 ──────────────────────────────────────
// バトル中の Tower.getDamage() は Base LV（ガチャ重複で上昇する
// 恒久強化）による倍率 bf を攻撃力に乗算しているが、タレット選択
// 画面／プレビュー画面はテンプレートの生値 ch.damage をそのまま
// 表示していたため、Base LV を上げた後にバトル中と数値が食い違って
// 見えるズレがあった。表示側にも同じ bf 計算を適用して一致させる。
function getEffectiveAtk(ch) {
  const lv = (playerData.baseLevels && playerData.baseLevels[ch.id]) || 1;
  const bf = 1 + (lv - 1) * 0.1;
  return Math.round(ch.damage * bf);
}

// ── アップデートログ表示 ─────────────────────────────────────
function openChangelog() {
  const body = document.getElementById('cl-body');
  if (body) {
    body.innerHTML = (typeof CHANGELOG !== 'undefined' ? CHANGELOG : []).map(entry => `
      <div class="cl-entry">
        <div class="cl-entry-head">
          <span class="cl-ver">VER. ${entry.version}</span>
          <span class="cl-date">${entry.date}</span>
        </div>
        <ul class="cl-items">
          ${entry.items.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }
  document.getElementById('changelog-overlay').classList.add('show');
}

function closeChangelog() {
  document.getElementById('changelog-overlay').classList.remove('show');
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

function removePartyById(id) {
  const i = playerData.party.indexOf(id);
  if (i >= 0) { playerData.party.splice(i, 1); autoSave('party-remove'); }
}

// ── ユニット回転プレビュー ────────────────────────────────────
let unitPreviewRAF  = null;
let unitPreviewAngle = 0;
let unitPreviewTmpl  = null;
let unitPreviewId    = null;

function openUnitPreview(id) {
  const ch = CHAR_TEMPLATES[id];
  if (!ch || !playerData.unlocked.includes(id)) return;
  unitPreviewTmpl = ch;
  unitPreviewId   = id;
  unitPreviewAngle = 0;

  const ov = document.getElementById('unit-preview-overlay');
  ov.classList.add('show');

  const rc = RARITY_COLORS[ch.rarity] || '#00e8ff';
  const maxParty = getMaxPartySize();
  const equipped = playerData.party.includes(id);
  const full = playerData.party.length >= maxParty;

  document.getElementById('up-name').textContent = ch.name;
  document.getElementById('up-name').style.color = ch.color;
  document.getElementById('up-name').style.textShadow = `0 0 16px ${ch.color}`;
  document.getElementById('up-rarity').textContent = `${'★'.repeat(ch.rarity==='SSR'?3:ch.rarity==='SR'?2:1)} ${ch.rarity}`;
  document.getElementById('up-rarity').style.color = rc;
  document.getElementById('up-type').textContent = ch.type;
  document.getElementById('up-desc').textContent = ch.desc;
  document.getElementById('up-stats').innerHTML = `
    <div class="up-stat"><span>ATK</span><b>${getEffectiveAtk(ch)}</b></div>
    <div class="up-stat"><span>RNG</span><b>${ch.range}</b></div>
    <div class="up-stat"><span>CD</span><b>${ch.cooldown}</b></div>
    <div class="up-stat"><span>COST</span><b>${getTowerCost(ch)}C</b></div>
    <div class="up-stat"><span>MAX</span><b>${ch.max}</b></div>
    <div class="up-stat"><span>BASE LV</span><b>${playerData.baseLevels[id]}</b></div>
  `;

  const btn = document.getElementById('up-equip-btn');
  btn.textContent = equipped ? '◈ REMOVE FROM PARTY' : (full ? '◈ EQUIP（最古枠と入替）' : '◈ EQUIP');
  btn.onclick = () => {
    if (equipped) removePartyById(id);
    else addParty(id);
    closeUnitPreview();
    renderParty();
  };

  if (unitPreviewRAF) cancelAnimationFrame(unitPreviewRAF);
  unitPreviewLoop();
}

function closeUnitPreview() {
  if (unitPreviewRAF) cancelAnimationFrame(unitPreviewRAF);
  unitPreviewRAF = null;
  document.getElementById('unit-preview-overlay').classList.remove('show');
}

function unitPreviewLoop() {
  const cv = document.getElementById('unit-preview-canvas');
  if (!cv || !unitPreviewTmpl) return;
  const c2 = cv.getContext('2d');
  unitPreviewAngle += 0.02;
  drawUnitPreview(c2, unitPreviewTmpl, unitPreviewAngle);
  unitPreviewRAF = requestAnimationFrame(unitPreviewLoop);
}

// タレットを回転させながら描画するプレビューレンダラ
function drawUnitPreview(c2, tmpl, angle) {
  const W = 280, H = 280, cx = W/2, cy = H/2;
  c2.clearRect(0, 0, W, H);

  // 背景グリッド
  c2.save();
  c2.strokeStyle = 'rgba(0,245,255,0.05)';
  c2.lineWidth = 1;
  for (let i = 0; i <= W; i += 28) { c2.beginPath(); c2.moveTo(i, 0); c2.lineTo(i, H); c2.stroke(); }
  for (let i = 0; i <= H; i += 28) { c2.beginPath(); c2.moveTo(0, i); c2.lineTo(W, i); c2.stroke(); }
  c2.restore();

  // プラットフォーム
  c2.save();
  c2.translate(cx, cy);
  const g = c2.createRadialGradient(0, 0, 10, 0, 0, 120);
  g.addColorStop(0, 'rgba(20,30,60,0.9)');
  g.addColorStop(1, 'rgba(4,6,20,0)');
  c2.fillStyle = g;
  c2.beginPath(); c2.arc(0, 0, 120, 0, Math.PI*2); c2.fill();

  c2.strokeStyle = tmpl.color + '44';
  c2.lineWidth = 1;
  c2.setLineDash([4, 6]);
  c2.beginPath(); c2.arc(0, 0, 95, 0, Math.PI*2); c2.stroke();
  c2.setLineDash([]);
  // 外環コースター回転
  c2.save();
  c2.rotate(-angle * 0.5);
  c2.strokeStyle = tmpl.color + '33';
  for (let i = 0; i < 4; i++) {
    const a = Math.PI/2 * i;
    c2.beginPath(); c2.arc(0, 0, 110, a, a + 0.5); c2.stroke();
  }
  c2.restore();
  c2.restore();

  // 本体（回転）
  c2.save();
  c2.translate(cx, cy);
  c2.rotate(angle);
  c2.shadowBlur = 24;
  c2.shadowColor = tmpl.color;
  c2.fillStyle = 'rgba(4,6,24,0.95)';
  c2.strokeStyle = tmpl.color;
  c2.lineWidth = 2;
  drawPreviewShape(c2, tmpl.id, tmpl, angle);
  c2.restore();

  // バレル（逆方向にゆっくり回す＆上下にスライド）
  c2.save();
  c2.translate(cx, cy);
  c2.rotate(-angle * 0.6);
  c2.fillStyle = 'rgba(200,220,255,0.9)';
  c2.shadowBlur = 10; c2.shadowColor = tmpl.color;
  const bw = 7, bl = 26 + Math.sin(angle * 2) * 4;
  c2.fillRect(8, -bw/2, bl, bw);
  c2.fillStyle = tmpl.color;
  c2.fillRect(8 + bl - 4, -bw/2 - 1, 5, bw + 2);
  c2.restore();

  // マーカー
  c2.save();
  c2.fillStyle = tmpl.color;
  c2.globalAlpha = 0.9;
  const ma = angle * 1.4;
  c2.beginPath();
  c2.arc(cx + Math.cos(ma)*95, cy + Math.sin(ma)*95, 3, 0, Math.PI*2);
  c2.fill();
  c2.restore();
}

// プレビュー用ボディ形状（game.js の drawShape と同系統の簡易版）
function drawPreviewShape(c2, id, tmpl, angle) {
  const S = (fn) => { fn(); };
  if (id===0||id===4||id===7||id===10) {
    c2.fillRect(-16,-16,32,32); c2.strokeRect(-16,-16,32,32);
    if (id===10) { c2.save(); c2.rotate(Math.PI/4); c2.strokeRect(-12,-12,24,24); c2.restore(); }
  } else if (id===1||id===5) {
    c2.beginPath(); c2.moveTo(0,-18); c2.lineTo(17,14); c2.lineTo(-17,14); c2.closePath(); c2.fill(); c2.stroke();
  } else if (id===2||id===11) {
    c2.beginPath(); c2.moveTo(0,-18); c2.lineTo(18,0); c2.lineTo(0,18); c2.lineTo(-18,0); c2.closePath(); c2.fill(); c2.stroke();
    if (id===11) { c2.beginPath(); c2.moveTo(-12,0); c2.lineTo(12,0); c2.stroke(); }
  } else if (id===3) {
    c2.beginPath(); c2.arc(0,0,16,0,Math.PI*2); c2.fill(); c2.stroke();
    c2.strokeRect(-8,-8,16,16);
  } else if (id===6) {
    c2.beginPath(); c2.moveTo(-6,-19); c2.lineTo(6,-19); c2.lineTo(10,19); c2.lineTo(-10,19); c2.closePath(); c2.fill(); c2.stroke();
  } else if (id===8) {
    c2.beginPath(); c2.arc(0,0,16,0,Math.PI*2); c2.fill(); c2.stroke();
    for (let i = 0; i < 3; i++) {
      const a = Math.PI*2/3*i + angle;
      c2.beginPath(); c2.moveTo(0,0); c2.lineTo(Math.cos(a)*16, Math.sin(a)*16); c2.stroke();
    }
  } else if (id===9) {
    c2.beginPath(); c2.arc(0,0,10,0,Math.PI*2); c2.fill(); c2.stroke();
    for (let i = 0; i < 3; i++) {
      const a = Math.PI*2/3*i;
      c2.beginPath(); c2.arc(Math.cos(a)*14, Math.sin(a)*14, 6, 0, Math.PI*2); c2.fill(); c2.stroke();
    }
  } else if (id===12) {
    c2.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI/4*i;
      const r = i%2===0 ? 18 : 9;
      c2[i===0?'moveTo':'lineTo'](Math.cos(a)*r, Math.sin(a)*r);
    }
    c2.closePath(); c2.fill(); c2.stroke();
  } else if (id===13) {
    c2.beginPath(); c2.arc(0,0,15,0,Math.PI*2); c2.fill(); c2.stroke();
    c2.lineWidth = 2.5;
    c2.beginPath(); c2.moveTo(-4,-13); c2.lineTo(5,-3); c2.lineTo(-3,0); c2.lineTo(4,13); c2.stroke();
  } else if (id===14) {
    c2.beginPath(); c2.moveTo(0,-18); c2.lineTo(11,12); c2.lineTo(-11,12); c2.closePath(); c2.fill(); c2.stroke();
    c2.setLineDash([2,3]);
    c2.beginPath(); c2.arc(0,-5, 5 + (Math.abs(Math.sin(angle*3))*6), 0, Math.PI*2); c2.stroke();
    c2.setLineDash([]);
  } else if (id===15) {
    c2.beginPath(); c2.arc(0,0,9,0,Math.PI*2); c2.fill(); c2.stroke();
    for (let i = 1; i <= 2; i++) {
      c2.beginPath(); c2.arc(0,0, 9+i*7+Math.sin(angle*2+i)*2, 0, Math.PI*2); c2.stroke();
    }
  } else if (id===16) {
    c2.beginPath();
    c2.moveTo(0,-19); c2.lineTo(12,5); c2.lineTo(5,5); c2.lineTo(7,17);
    c2.lineTo(-7,17); c2.lineTo(-5,5); c2.lineTo(-12,5);
    c2.closePath(); c2.fill(); c2.stroke();
  } else if (id===17) {
    c2.fillRect(-17,-15,34,30); c2.strokeRect(-17,-15,34,30);
    c2.fillStyle = tmpl.color;
    c2.fillRect(-11,-5,8,10); c2.fillRect(3,-5,8,10);
  } else if (id===18) {
    c2.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI/3*i; c2.lineTo(Math.cos(a)*17, Math.sin(a)*17); }
    c2.closePath(); c2.fill(); c2.stroke();
    c2.lineWidth = 2;
    c2.beginPath(); c2.moveTo(-7,-7); c2.lineTo(7,7); c2.moveTo(7,-7); c2.lineTo(-7,7); c2.stroke();
  } else if (id===19) {
    c2.beginPath();
    c2.moveTo(-14,-12); c2.lineTo(3,0); c2.lineTo(-14,12);
    c2.moveTo(-5,-12); c2.lineTo(12,0); c2.lineTo(-5,12);
    c2.stroke();
    c2.beginPath(); c2.arc(0,0,10,0,Math.PI*2); c2.fill(); c2.stroke();
  } else if (id===20) {
    c2.beginPath();
    c2.moveTo(0,-18); c2.lineTo(14,-10); c2.lineTo(14,5);
    c2.quadraticCurveTo(14,14, 0,19);
    c2.quadraticCurveTo(-14,14, -14,5);
    c2.lineTo(-14,-10); c2.closePath(); c2.fill(); c2.stroke();
    c2.beginPath(); c2.moveTo(0,-10); c2.lineTo(0,10); c2.stroke();
    c2.beginPath(); c2.arc(0,3,5,0,Math.PI*2); c2.stroke();
  } else if (id===21) {
    c2.beginPath(); c2.arc(0,0,13,0,Math.PI*2); c2.fill(); c2.stroke();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI/4*i + angle*0.5;
      c2.beginPath();
      c2.moveTo(Math.cos(a)*15, Math.sin(a)*15);
      c2.lineTo(Math.cos(a)*22, Math.sin(a)*22);
      c2.stroke();
    }
  } else if (id===22) {
    for (let k = 0; k < 3; k++) {
      c2.save();
      c2.rotate(k * Math.PI*2/3 + angle*0.3);
      c2.beginPath(); c2.moveTo(0,-17); c2.lineTo(10,7); c2.lineTo(-10,7); c2.closePath();
      c2.globalAlpha = 0.75; c2.stroke();
      c2.restore();
    }
    c2.beginPath(); c2.arc(0,0,6,0,Math.PI*2); c2.fill();
  } else if (id===23) {
    c2.beginPath(); c2.arc(0,0,15,0,Math.PI*2); c2.fill(); c2.stroke();
    c2.save();
    c2.rotate(angle * 3);
    c2.strokeStyle = tmpl.color + 'aa';
    for (let i = 0; i < 3; i++) { c2.beginPath(); c2.arc(0, 0, 7 + i * 4, i, i + 2.2); c2.stroke(); }
    c2.restore();
  } else if (id===24) {
    c2.beginPath(); c2.arc(0,0,10,0,Math.PI*2); c2.fill(); c2.stroke();
    c2.save();
    c2.rotate(angle * 2);
    c2.lineWidth = 3;
    c2.beginPath(); c2.moveTo(0,-18); c2.lineTo(0,18); c2.stroke();
    c2.rotate(Math.PI/2);
    c2.globalAlpha = 0.5;
    c2.beginPath(); c2.moveTo(0,-13); c2.lineTo(0,13); c2.stroke();
    c2.restore();
  } else if (id===25) {
    c2.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI/2 + Math.PI/5*i;
      const r = i % 2 === 0 ? 17 : 7;
      c2[i===0?'moveTo':'lineTo'](Math.cos(a)*r, Math.sin(a)*r);
    }
    c2.closePath(); c2.fill(); c2.stroke();
  } else if (id===26) {
    c2.beginPath();
    c2.moveTo(19,0); c2.lineTo(2,-4); c2.lineTo(-17,-2);
    c2.lineTo(-17,2); c2.lineTo(2,4);
    c2.closePath(); c2.fill(); c2.stroke();
  } else if (id===27) {
    c2.save();
    c2.rotate(angle * 1.5);
    for (let arm = 0; arm < 2; arm++) {
      c2.beginPath();
      for (let t = 0; t < 14; t++) {
        const a = arm * Math.PI + t * 0.42;
        const r = 2 + t * 1.0;
        c2[t===0?'moveTo':'lineTo'](Math.cos(a)*r, Math.sin(a)*r);
      }
      c2.globalAlpha = 0.75; c2.stroke();
    }
    c2.restore();
    c2.beginPath(); c2.arc(0,0,4,0,Math.PI*2); c2.fill();
  } else if (id===28) {
    c2.beginPath(); c2.arc(0,0,16,0,Math.PI*2); c2.fill(); c2.stroke();
    for (let i = 0; i < 12; i++) {
      const a = Math.PI/6*i;
      c2.beginPath();
      c2.moveTo(Math.cos(a)*12, Math.sin(a)*12);
      c2.lineTo(Math.cos(a)*16, Math.sin(a)*16);
      c2.stroke();
    }
    c2.lineWidth = 2.5;
    c2.beginPath(); c2.moveTo(0,0); c2.lineTo(Math.cos(angle*2)*9, Math.sin(angle*2)*9); c2.stroke();
    c2.beginPath(); c2.moveTo(0,0); c2.lineTo(Math.cos(-angle)*13, Math.sin(-angle)*13); c2.stroke();
  } else if (id===29) {
    c2.beginPath();
    c2.moveTo(-11,-16); c2.lineTo(11,-16); c2.lineTo(0,-1); c2.closePath();
    c2.moveTo(-11,16); c2.lineTo(11,16); c2.lineTo(0,1); c2.closePath();
    c2.fill(); c2.stroke();
    const sy2 = ((angle * 30) % 12) - 6;
    c2.fillStyle = tmpl.color;
    c2.fillRect(-1, sy2, 2, 2);
  } else if (id===30) {
    c2.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = Math.PI/8*i + angle*1.2;
      const r = i % 2 === 0 ? 18 : 9;
      c2[i===0?'moveTo':'lineTo'](Math.cos(a)*r, Math.sin(a)*r);
    }
    c2.closePath(); c2.fill(); c2.stroke();
  } else if (id===31) {
    // JUDGMENT — 天秤と光の剣
    c2.beginPath(); c2.moveTo(0,-19); c2.lineTo(0,17); c2.stroke();
    c2.beginPath(); c2.moveTo(-14,-12); c2.lineTo(14,-12); c2.stroke();
    c2.beginPath(); c2.arc(-14,-5,5,0,Math.PI*2); c2.stroke();
    c2.beginPath(); c2.arc(14,-5,5,0,Math.PI*2); c2.stroke();
    c2.fillStyle = `rgba(255,238,120,${0.55 + Math.sin(angle*4)*0.45})`;
    c2.beginPath(); c2.moveTo(0,3); c2.lineTo(5,17); c2.lineTo(-5,17); c2.closePath(); c2.fill();
  } else if (id===32) {
    // REAPER — 鎌の刃と柄
    c2.save();
    c2.rotate(angle * 2);
    c2.lineWidth = 3;
    c2.beginPath(); c2.arc(0,0,15,Math.PI*0.75,Math.PI*1.85); c2.stroke();
    c2.restore();
    c2.beginPath(); c2.moveTo(8,4); c2.lineTo(-11,17); c2.stroke();
    c2.beginPath(); c2.arc(0,0,5,0,Math.PI*2); c2.fill();
  } else if (id===33) {
    // ECHO — ずれた二重の波紋
    c2.globalAlpha = 0.9;
    c2.beginPath(); c2.arc(-4,0,13,0,Math.PI*2); c2.stroke();
    c2.globalAlpha = 0.4;
    c2.beginPath(); c2.arc(5,0,13,0,Math.PI*2); c2.stroke();
    c2.globalAlpha = 1;
    c2.beginPath(); c2.arc(0,0,5,0,Math.PI*2); c2.fill();
  } else if (id===34) {
    // CHIMERA — 三つの面が巡る
    c2.save();
    c2.rotate(angle * 2.4);
    for (let k = 0; k < 3; k++) {
      const a = Math.PI*2/3*k;
      c2.beginPath(); c2.arc(Math.cos(a)*9, Math.sin(a)*9, 7, 0, Math.PI*2); c2.stroke();
    }
    c2.restore();
    c2.beginPath(); c2.arc(0,0,4,0,Math.PI*2); c2.fill();
  } else if (id===35) {
    // ZERO — 空虚の円環
    c2.lineWidth = 3.5;
    c2.beginPath(); c2.arc(0,0,15,0,Math.PI*2); c2.stroke();
    c2.save();
    c2.rotate(-angle * 1.5);
    c2.globalAlpha = 0.5;
    c2.lineWidth = 1;
    c2.setLineDash([2,5]);
    c2.beginPath(); c2.arc(0,0,20,0,Math.PI*2); c2.stroke();
    c2.setLineDash([]);
    c2.restore();
    c2.fillStyle = '#ffffff';
    c2.beginPath(); c2.arc(0,0,2.5,0,Math.PI*2); c2.fill();
  }
}

// ────────────────────────────────────────────────
//  ARCHIVE SCREEN（敵アーカイブ / 図鑑）
// ────────────────────────────────────────────────
function renderArchive() {
  const c = document.getElementById('archive-list');
  if (!c) return;
  c.innerHTML = '';
  const kills = playerData.enemyKills || {};
  const totalKills = Object.values(kills).reduce((a, b) => a + b, 0);
  const totalEl = document.getElementById('archive-total');
  if (totalEl) totalEl.textContent = `TOTAL KILLS: ${totalKills}`;

  const analyzed = ENEMY_CATALOG.filter(en => (kills[en.type] || 0) > 0).length;
  const progressEl = document.getElementById('archive-progress');
  if (progressEl) progressEl.textContent = `ANALYZED: ${analyzed}/${ENEMY_CATALOG.length}`;

  ENEMY_CATALOG.forEach(en => {
    const k = kills[en.type] || 0;
    const unlocked = k > 0;
    const card = document.createElement('div');
    card.className = 'archive-card' + (unlocked ? ' unlocked' : '');
    if (!unlocked) card.classList.add('unknown');
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div class="archive-icon" style="border-color:${unlocked ? en.color : '#223'};color:${unlocked ? en.color : '#223'};box-shadow:${unlocked ? `0 0 14px ${en.color}44` : 'none'};">
          ${unlocked ? en.name[0] : '?'}
        </div>
        <div style="flex:1;">
          <div class="archive-name" style="color:${unlocked ? en.color : '#334'};">${unlocked ? en.name : 'UNKNOWN SIGNAL'}</div>
          <div style="font-size:0.55rem;letter-spacing:2px;color:#445;">${unlocked ? en.type : 'UNANALYZED'}</div>
        </div>
        <div class="archive-kills" style="color:${unlocked ? '#ffd700' : '#334'};">
          <div style="font-family:var(--font-main);font-size:1rem;font-weight:900;">${unlocked ? k.toLocaleString() : '—'}</div>
          <div style="font-size:0.5rem;letter-spacing:2px;color:#445;">KILLS</div>
        </div>
      </div>
      <div class="archive-stats">
        <div>HP <b>${unlocked ? en.hp : '?'}</b></div>
        <div>SPD <b>${unlocked ? en.spd : '?'}</b></div>
      </div>
      <div class="archive-ability">${unlocked ? en.ability : 'まだ撃破したことがない敵。初めて撃破すると解析データが復元される。'}</div>
    `;
    c.appendChild(card);
  });
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
    if (roll < 0.03)      pool = CHAR_TEMPLATES.filter(c => c.rarity === 'SSR' && !c.craft && !c.drop);
    else if (roll < 0.21) pool = CHAR_TEMPLATES.filter(c => c.rarity === 'SR' && !c.craft && !c.drop);
    else                  pool = CHAR_TEMPLATES.filter(c => c.rarity === 'R' && !c.craft && !c.drop);
    const ch = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !playerData.unlocked.includes(ch.id);
    if (isNew) playerData.unlocked.push(ch.id);
    else playerData.baseLevels[ch.id]++;
    results.push({ ch, isNew });
  }
  playGachaSequence(results);
  autoSave('gacha');
}

function playGachaSequence(results) {
  const overlay     = document.getElementById('gacha-overlay');
  const chargeLabel = document.getElementById('gacha-charge-label');
  const closeBtn    = document.getElementById('gacha-close-btn');
  if (!overlay) { revealResults(results); return; }

  const bestRarity = results.some(r => r.ch.rarity === 'SSR') ? 'SSR'
                    : results.some(r => r.ch.rarity === 'SR')  ? 'SR' : 'R';

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

  const beam = document.createElement('div');
  beam.className = 'gacha-result-beam';
  beam.style.background = `linear-gradient(180deg,transparent,${results[0].ch.color},transparent)`;
  document.getElementById('gacha-result-bg').innerHTML = '';
  document.getElementById('gacha-result-bg').appendChild(beam);

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
// ════════════════════════════════════════════════════════════

const LOCAL_SAVE_KEY = 'neonDefenseSave';

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

function serializePlayerData() {
  return {
    crystals:   playerData.crystals,
    baseLevels: [...playerData.baseLevels],
    unlocked:   [...playerData.unlocked],
    party:      [...playerData.party],
    stageBestWave: [...playerData.stageBestWave],
    stageCleared:  [...playerData.stageCleared],
    augments:      [...playerData.augments],
    enemyKills:    Object.assign({}, playerData.enemyKills),
    soundEnabled:  playerData.soundEnabled,
    materials:     Object.assign({}, playerData.materials),
    settings:      Object.assign({}, playerData.settings),
    savedAt:    new Date().toISOString()
  };
}

function applyCloudData(data) {
  if (!data) return;
  if (typeof data.crystals === 'number')  playerData.crystals   = data.crystals;
  if (Array.isArray(data.baseLevels)) {
    playerData.baseLevels = [...data.baseLevels];
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
  if (data.enemyKills && typeof data.enemyKills === 'object') {
    playerData.enemyKills = Object.assign({}, data.enemyKills);
  }
  if (typeof data.soundEnabled === 'boolean') playerData.soundEnabled = data.soundEnabled;
  if (data.materials && typeof data.materials === 'object') {
    playerData.materials = Object.assign({}, data.materials);
  }
  if (data.settings && typeof data.settings === 'object') {
    playerData.settings = Object.assign({ lightMode:false, effectLevel:'high', autoSkip:false }, data.settings);
  }
  applySettingsGlobal();
  const maxParty = getMaxPartySize();
  if (playerData.party.length > maxParty) playerData.party = playerData.party.slice(0, maxParty);
  updateMeta();
  const activeId = document.querySelector('.screen.active')?.id;
  if (activeId === 'screen-party') renderParty();
  if (activeId === 'screen-stage') renderStages();
  if (activeId === 'screen-augment') renderAugments();
  if (activeId === 'screen-gacha') syncSoundToggleUI();
  if (activeId === 'screen-archive') renderArchive();
  if (activeId === 'screen-forge') renderForge();
  if (activeId === 'screen-config') renderConfig();
}

function saveLocal() {
  try {
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(serializePlayerData()));
  } catch(e) { console.warn('[LocalSave] 失敗:', e); }
}

function getLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(_) { return null; }
}

function hasGuestProgress(data) {
  if (!data) return false;
  if (data.crystals !== 600)                                   return true;
  if ((data.unlocked?.length  ?? 0) > 2)                      return true;
  if ((data.baseLevels ?? []).some((lv, i) => i > 1 && lv > 1)) return true;
  if (data.enemyKills && Object.keys(data.enemyKills).length > 0) return true;
  return false;
}

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
        applyCloudData(localData);
      }
      resolve('local');
    };

    document.getElementById('_mg-btn-cloud').onclick = () => {
      wrap.remove();
      applyCloudData(cloudData);
      saveLocal();
      showToast('クラウドデータを読み込みました');
      resolve('cloud');
    };
  });
}

// ════════════════════════════════════════════════════════════
//  GOOGLE AUTH & CLOUD SAVE
// ════════════════════════════════════════════════════════════

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

let _autoSaveTimer = null;

async function autoSave(reason) {
  saveLocal();

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

window.addEventListener('beforeunload', () => {
  saveLocal();
  if (!window._currentUser || typeof window._saveData !== 'function') return;
  try { window._saveData(window._currentUser.uid, serializePlayerData()); } catch(_) {}
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') autoSave('tab-hidden');
});

async function loadFromCloud(uid) {
  if (typeof window._loadData !== 'function') return;
  try {
    const cloudData = await window._loadData(uid);
    const localData = getLocalData();
    const guestHasProgress = hasGuestProgress(localData);

    if (!cloudData) {
      if (guestHasProgress) {
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

    if (guestHasProgress) {
      await showMigrateDialog(uid, localData, cloudData);
    } else {
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


// ════════════════════════════════════════════════════════════
//  FORGE — 素材工房（素材でキャラを制作）
// ════════════════════════════════════════════════════════════
function renderForge() {
  const c = document.getElementById('forge-list');
  if (!c) return;
  c.innerHTML = '';
  const matsBar = document.getElementById('forge-materials');
  if (matsBar) {
    matsBar.innerHTML = '';
    MATERIAL_TEMPLATES.forEach(m => {
      const n = getMaterialCount(m.id);
      const chip = document.createElement('div');
      chip.className = 'mat-chip';
      chip.title = m.desc;
      chip.innerHTML = `
        <div class="mat-icon" style="background:${m.color};box-shadow:0 0 10px ${m.color}66;"></div>
        <div>
          <div class="mat-name">${m.nameJp} <span style="color:#445;font-size:0.55rem;">${m.name}</span></div>
          <div class="mat-count" style="color:${n > 0 ? '#ffd700' : '#334'};">×${n}</div>
        </div>`;
      matsBar.appendChild(chip);
    });
  }
  CHAR_TEMPLATES.filter(ch => ch.craft).forEach(ch => {
    const unlocked = playerData.unlocked.includes(ch.id);
    const rc = RARITY_COLORS[ch.rarity] || '#00e8ff';
    const card = document.createElement('div');
    card.className = 'char-card' + (unlocked ? ' selected' : '');
    card.style.borderColor = unlocked ? ch.color : '';
    const costRows = Object.entries(ch.craft).map(([mid, n]) => {
      const t = MATERIAL_TEMPLATES.find(m => m.id === mid);
      const have = getMaterialCount(mid);
      const ok = have >= n;
      return `<div class="craft-cost${ok ? ' ok' : ''}">${t ? t.nameJp : mid} <b>${have}/${n}</b></div>`;
    }).join('');
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <div class="char-card-name" style="color:${ch.color};">${ch.name}</div>
        <div style="font-family:var(--font-main);font-size:0.6rem;color:${rc};">${ch.rarity}</div>
      </div>
      <div class="char-card-type" style="color:${rc};">${ch.type}${unlocked ? ' — 制作済み' : ''}</div>
      <div class="char-card-desc" style="min-height:44px;">${ch.desc}</div>
      <div class="craft-costs">${costRows}</div>
      <button class="btn-craft" ${unlocked || !canCraftUnit(ch) ? 'disabled' : ''} onclick="event.stopPropagation(); craftUnit(${ch.id})">
        ${unlocked ? '✓ UNLOCKED' : '⚒ 制作する'}
      </button>
    `;
    card.onclick = () => { if (playerData.unlocked.includes(ch.id)) openUnitPreview(ch.id); };
    c.appendChild(card);
  });
}

function craftUnit(id) {
  const ch = CHAR_TEMPLATES[id];
  if (!ch || !ch.craft) return;
  if (playerData.unlocked.includes(id)) return;
  if (!canCraftUnit(ch)) { alert("素材が不足しています。"); return; }
  Object.entries(ch.craft).forEach(([mid, n]) => { playerData.materials[mid] -= n; });
  playerData.unlocked.push(id);
  showToast(`⚒ ${ch.name} の制作に成功！`);
  autoSave('craft');
  renderForge();
}

// ════════════════════════════════════════════════════════════
//  CONFIG — 設定（軽量化モード / エフェクト量 / 自動スキップ）
// ════════════════════════════════════════════════════════════
function applySettingsGlobal() {
  const s = playerData.settings || {};
  document.body.classList.toggle('light-mode', !!s.lightMode);
  window.__lightMode = !!s.lightMode;
  syncAutoSkipBattleUI();
}

function toggleLightMode() {
  playerData.settings.lightMode = !playerData.settings.lightMode;
  applySettingsGlobal();
  autoSave('settings');
  renderConfig();
}

function setEffectLevel(lv) {
  playerData.settings.effectLevel = lv;
  autoSave('settings');
  renderConfig();
}

function toggleAutoSkip() {
  playerData.settings.autoSkip = !playerData.settings.autoSkip;
  autoSave('settings');
  renderConfig();
  syncAutoSkipBattleUI();
}

// ── バトル中に呼び出す AUTO SKIP トグル（HUDボタン用）──────────
// 設定画面（screen-config）に移動すると作戦が中断されてしまうため、
// バトル画面から直接ON/OFFできるようにする。
function toggleAutoSkipBattle() {
  playerData.settings.autoSkip = !playerData.settings.autoSkip;
  autoSave('settings');
  syncAutoSkipBattleUI();
  renderConfig(); // 設定画面が裏で開かれていても表示を同期
}

function syncAutoSkipBattleUI() {
  const btn = document.getElementById('btn-autoskip');
  if (!btn) return;
  const on = !!(playerData.settings && playerData.settings.autoSkip);
  btn.textContent = on ? 'AUTO: ON' : 'AUTO: OFF';
  btn.classList.toggle('active', on);
}

function renderConfig() {
  const c = document.getElementById('config-list');
  if (!c) return;
  const s = playerData.settings;
  c.innerHTML = `
    <div class="config-row">
      <div>
        <div class="config-name">LIGHTWEIGHT MODE — 軽量化モード</div>
        <div class="config-desc">発光描画（シャドウ）・スキャンライン・背景演出を削減し、動作を軽くします。</div>
      </div>
      <button class="cfg-toggle${s.lightMode ? ' on' : ''}" onclick="toggleLightMode()">${s.lightMode ? 'ON' : 'OFF'}</button>
    </div>
    <div class="config-row">
      <div>
        <div class="config-name">EFFECT LEVEL — エフェクト量</div>
        <div class="config-desc">パーティクル数・環境演出の量を LOW / MID / HIGH で調節します。</div>
      </div>
      <div class="seg-btns">
        ${['low','mid','high'].map(l => `<button class="seg-btn${s.effectLevel === l ? ' active' : ''}" onclick="setEffectLevel('${l}')">${{low:'LOW',mid:'MID',high:'HIGH'}[l]}</button>`).join('')}
      </div>
    </div>
    <div class="config-row">
      <div>
        <div class="config-name">AUTO SKIP — 自動スキップ</div>
        <div class="config-desc">バトル中、敵が少なくなったタイミングで次ウェーブを自動で呼び出します。</div>
      </div>
      <button class="cfg-toggle${s.autoSkip ? ' on' : ''}" onclick="toggleAutoSkip()">${s.autoSkip ? 'ON' : 'OFF'}</button>
    </div>
    <div class="config-row">
      <div>
        <div class="config-name">SOUND — 効果音</div>
        <div class="config-desc">ガチャ演出などの合成効果音を再生します。</div>
      </div>
      <button class="cfg-toggle${playerData.soundEnabled ? ' on' : ''}" onclick="toggleSound(); renderConfig();">${playerData.soundEnabled ? 'ON' : 'OFF'}</button>
    </div>
  `;
}
applySettingsGlobal();
