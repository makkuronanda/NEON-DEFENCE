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
    const diffColor = s.diff === 'NORMAL' ? 'var(--green)' : s.diff === 'HARD' ? 'var(--orange)' : 'var(--red)';
    const isNew = s.id >= 3;
    const card = document.createElement('div');
    card.className = 'stage-card';
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div class="stage-name" style="color:${s.color};text-shadow:0 0 8px ${s.color}44;">${s.name}</div>
        <div style="display:flex;gap:6px;align-items:center;">
          ${isNew ? '<span style="font-family:var(--font-main);font-size:0.5rem;letter-spacing:2px;padding:1px 6px;border:1px solid #ffd700;color:#ffd700;animation:pulse-glow 1.5s infinite;">NEW</span>' : ''}
          <span style="font-family:var(--font-main);font-size:0.55rem;letter-spacing:2px;padding:2px 8px;border:1px solid ${diffColor};color:${diffColor};">${s.diff}</span>
        </div>
      </div>
      ${s.desc ? `<div style="font-size:0.62rem;color:#557;margin-bottom:8px;line-height:1.5;">${s.desc}</div>` : ''}
      <div class="stage-gimmick">▸ ${s.gimmick}</div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap;">
        <span class="stage-badge" style="border:1px solid #2a3050;color:#668;">${s.waves} WAVES</span>
        <span class="stage-badge" style="border:1px solid #2a3050;color:#668;">START: ${s.startMoney||150}C / ${s.startHp||20}HP</span>
        <span class="stage-badge" style="border:1px solid #2a3050;color:#668;">BOSS OVERDRIVE</span>
        <span class="stage-badge" style="border:1px solid ${s.color}44;color:${s.color}88;">PATH-${(s.pathId||0)+1}</span>
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
  for (let i = 0; i < 3; i++) {
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
  if (playerData.party.length >= 3) playerData.party.shift();
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
//  GACHA
// ────────────────────────────────────────────────
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
  showGachaResult(results);
  autoSave('gacha');
}

function showGachaResult(results) {
  const overlay    = document.getElementById('gacha-overlay');
  const container  = document.getElementById('gacha-multi-results');
  const starsEl    = document.getElementById('gacha-stars');
  container.innerHTML = '';
  starsEl.innerHTML   = '';

  // Star burst
  const highValue = results.some(r => r.ch.rarity === 'SSR');
  const starCount = highValue ? 60 : 30;
  const starColors = results.map(r => r.ch.color);
  for (let i = 0; i < starCount; i++) {
    const s = document.createElement('div');
    s.className = 'gacha-star';
    const angle = Math.random() * 360;
    const dist  = 50 + Math.random() * 200;
    const tx = Math.cos(angle * Math.PI / 180) * dist;
    const ty = Math.sin(angle * Math.PI / 180) * dist;
    s.style.cssText = `
      left:50%;top:50%;
      background:${starColors[Math.floor(Math.random() * starColors.length)]};
      --tx:${tx}px;--ty:${ty}px;
      animation-delay:${Math.random() * 0.5}s;
      animation-duration:${1 + Math.random()}s;
    `;
    starsEl.appendChild(s);
  }

  // Result cards
  results.forEach((r, idx) => {
    const { ch, isNew } = r;
    const rc = RARITY_COLORS[ch.rarity] || '#00e8ff';
    const card = document.createElement('div');
    card.className = 'gacha-result-card';
    card.style.cssText = `
      background:linear-gradient(135deg,rgba(5,8,25,0.98),rgba(10,5,30,0.98));
      border:1px solid ${rc};
      box-shadow:0 0 ${ch.rarity==='SSR'?40:20}px ${rc}${ch.rarity==='SSR'?'88':'44'};
      animation-delay:${idx * 0.08}s;
      ${results.length > 1 ? 'width:clamp(130px,22vw,200px);padding:30px 20px;' : ''}
    `;
    card.innerHTML = `
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
    `;
    container.appendChild(card);
  });

  // Beam
  const beam = document.createElement('div');
  beam.className = 'gacha-result-beam';
  beam.style.background = `linear-gradient(180deg,transparent,${results[0].ch.color},transparent)`;
  document.getElementById('gacha-result-bg').innerHTML = '';
  document.getElementById('gacha-result-bg').appendChild(beam);

  overlay.classList.add('show');
}

function closeGachaOverlay() {
  document.getElementById('gacha-overlay').classList.remove('show');
  updateMeta();
}

// ════════════════════════════════════════════════════════════
//  GOOGLE AUTH & CLOUD SAVE
// ════════════════════════════════════════════════════════════

// ── Toast helper ────────────────────────────────────────────
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

// ── Auth state callback (called by Firebase module) ─────────
window.onAuthChanged = function(user) {
  const btn      = document.getElementById('auth-btn');
  const saveWrap = document.getElementById('auth-save-wrap');
  const btnLabel = document.getElementById('auth-btn-label');
  const btnIcon  = document.getElementById('auth-btn-icon');
  const userName = document.getElementById('auth-user-name');

  if (user) {
    // Logged in
    btn.classList.add('logged-in');
    btnIcon.textContent  = '✕';
    btnLabel.textContent = 'LOGOUT';
    saveWrap.style.display = 'flex';
    userName.textContent   = user.displayName || user.email || 'USER';

    // Auto-load cloud data on login
    loadFromCloud(user.uid);
  } else {
    // Logged out
    btn.classList.remove('logged-in');
    btnIcon.textContent  = '⬡';
    btnLabel.textContent = 'GOOGLE LOGIN';
    saveWrap.style.display = 'none';
    userName.textContent   = '';
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

// ── Serialize player data ────────────────────────────────────
function serializePlayerData() {
  return {
    crystals:    playerData.crystals,
    baseLevels:  [...playerData.baseLevels],
    unlocked:    [...playerData.unlocked],
    party:       [...playerData.party],
    savedAt:     new Date().toISOString()
  };
}

// ── Deserialize & apply ──────────────────────────────────────
function applyCloudData(data) {
  if (!data) return;
  if (typeof data.crystals   === 'number') playerData.crystals   = data.crystals;
  if (Array.isArray(data.baseLevels)) {
    // Extend baseLevels if new characters were added after save
    playerData.baseLevels = data.baseLevels;
    while (playerData.baseLevels.length < CHAR_TEMPLATES.length)
      playerData.baseLevels.push(1);
  }
  if (Array.isArray(data.unlocked))        playerData.unlocked   = data.unlocked;
  if (Array.isArray(data.party))           playerData.party      = data.party;
  updateMeta();
  // Refresh visible screen
  const activeScreen = document.querySelector('.screen.active')?.id;
  if (activeScreen === 'screen-party') renderParty();
}

// ── Save to Firestore ────────────────────────────────────────
window.saveToCloud = async function() {
  const user = window._currentUser;
  if (!user) { showToast('ログインが必要です', true); return; }
  if (typeof window._saveData !== 'function') { showToast('Firebase not configured', true); return; }

  const btn = document.getElementById('save-btn');
  btn.classList.add('saving');
  btn.textContent = 'SAVING...';

  try {
    await window._saveData(user.uid, serializePlayerData());
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

// ── Auto-save ───────────────────────────────────────────────────────────
let _autoSaveTimer = null;

async function autoSave(reason) {
  const user = window._currentUser;
  if (!user || typeof window._saveData !== 'function') return;
  try {
    await window._saveData(user.uid, serializePlayerData());
    console.log('[AutoSave]', reason);
    const btn = document.getElementById('save-btn');
    if (btn) {
      btn.classList.add('saved');
      btn.textContent = '\u2713 AUTO';
      clearTimeout(btn._autoTid);
      btn._autoTid = setTimeout(() => {
        btn.classList.remove('saved');
        btn.textContent = 'SAVE';
      }, 1500);
    }
  } catch(e) {
    showToast('\u81ea\u52d5\u4fdd\u5b58\u306b\u5931\u6557: ' + e.message, true);
  }
}

function startAutoSaveInterval() {
  clearInterval(_autoSaveTimer);
  _autoSaveTimer = setInterval(() => autoSave('interval-30s'), 30000);
}
function stopAutoSaveInterval() {
  clearInterval(_autoSaveTimer);
}

const _origOnAuthChanged = window.onAuthChanged;
window.onAuthChanged = function(user) {
  if (_origOnAuthChanged) _origOnAuthChanged(user);
  if (user) startAutoSaveInterval();
  else      stopAutoSaveInterval();
};

window.addEventListener('beforeunload', () => {
  if (!window._currentUser || typeof window._saveData !== 'function') return;
  try { window._saveData(window._currentUser.uid, serializePlayerData()); } catch(_) {}
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') autoSave('tab-hidden');
});


// ── Load from Firestore ──────────────────────────────────────
async function loadFromCloud(uid) {
  if (typeof window._loadData !== 'function') return;
  try {
    const data = await window._loadData(uid);
    if (data) {
      applyCloudData(data);
      const d = new Date(data.savedAt);
      const dateStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
      showToast(`データをロードしました (${dateStr})`);
    } else {
      showToast('クラウドデータなし — 新規データで開始します');
    }
  } catch(e) {
    showToast('ロード失敗: ' + e.message, true);
  }
}
