/* ── State ───────────────────────────────── */
const state = {
  teams: [
    { name: 'Home', color: '#0566d9', score: 0 },
    { name: 'Away', color: '#dc2626', score: 0 }
  ],
  events: [],          // { team, type, player, cardType, timestamp, elapsed }
  totalSeconds: 2700,  // per-half duration
  currentHalf: 1,      // 1 or 2
  remaining: 2700,
  remainingAtStart: 2700,
  startEpoch: null,
  running: false,
  elapsedSeconds: 0,   // elapsed within current half
};
let timerInterval = null;

/* ── Helpers ─────────────────────────────── */
function pad(n) { return String(n).padStart(2, '0'); }
function fmt(s) { return `${pad(Math.floor(s/60))}:${pad(s%60)}`; }

// Escape user-controlled values before interpolating into innerHTML.
// Data can originate from localStorage or Supabase and must not be trusted as HTML.
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// Restored/tampered state may carry an invalid color that gets written into a
// style attribute. Only accept a literal #rrggbb value; otherwise fall back.
function safeColor(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function textColor(hex) {
  const r = parseInt(hex.slice(1,3),16),
        g = parseInt(hex.slice(3,5),16),
        b = parseInt(hex.slice(5,7),16);
  return (0.299*r + 0.587*g + 0.114*b)/255 > 0.45 ? '#111' : '#fff';
}

function elapsedLabel() {
  const cumulative = (state.currentHalf - 1) * state.totalSeconds + state.elapsedSeconds;
  return `${pad(Math.floor(cumulative/60))}'`;
}

/* ── DOM refs ────────────────────────────── */
const $ = id => document.getElementById(id);
const setupScreen    = $('setup-screen');
const gameScreen     = $('game-screen');
const clockEl        = $('clock');
const statusEl       = $('status-label');
const periodEl       = $('period-label');
const btnPlay        = $('btn-play');
const btnPause       = $('btn-pause');
const btnEndGame     = $('btn-end-game');
const modalOverlay   = $('modal-overlay');
const modalTitle     = $('modal-title');
const modalPlayer    = $('modal-player');
const cardTypeField  = $('card-type-field');
const btnYellow      = $('btn-yellow');
const btnRed         = $('btn-red');
const modalCancel    = $('modal-cancel');
const modalConfirm   = $('modal-confirm');
const endgameOverlay = $('endgame-overlay');
const btnNewGame     = $('btn-new-game');

/* ── Setup screen wiring ─────────────────── */
const colorA = $('color-a'), colorB = $('color-b');
const swatchA = $('swatch-a'), swatchB = $('swatch-b');

// Keep the swatch fill and the card's left accent bar in sync with the picker.
function syncTeamAccent(colorInput, swatch) {
  swatch.style.background = colorInput.value;
  const card = swatch.closest('.team-setup');
  if (card) card.style.setProperty('--team-accent', colorInput.value);
}
colorA.addEventListener('input', () => syncTeamAccent(colorA, swatchA));
colorB.addEventListener('input', () => syncTeamAccent(colorB, swatchB));
syncTeamAccent(colorA, swatchA);
syncTeamAccent(colorB, swatchB);

$('btn-start-game').addEventListener('click', async () => {
  const mins = Math.max(1, parseInt($('input-min').value)||45);
  const secs = Math.min(59, Math.max(0, parseInt($('input-sec').value)||0));
  state.totalSeconds = mins*60 + secs;
  state.currentHalf = 1;
  state.remaining    = state.totalSeconds;
  state.remainingAtStart = state.totalSeconds;
  state.startEpoch = null;
  state.elapsedSeconds = 0;

  state.teams[0].name  = $('name-a').value.trim() || 'Home';
  state.teams[0].color = colorA.value;
  state.teams[1].name  = $('name-b').value.trim() || 'Away';
  state.teams[1].color = colorB.value;

  state.teams[0].score = 0;
  state.teams[1].score = 0;
  state.events = [];

  applyTeamColors();
  renderScores();
  $('log-a').innerHTML = '';
  $('log-b').innerHTML = '';
  clockEl.textContent = fmt(state.remaining);
  statusEl.textContent = 'Ready';
  periodEl.textContent = '1st Half';
  clockEl.className = '';
  btnPlay.disabled  = false;
  btnPause.disabled = true;

  clearSavedState();
  $('notes-ingame').value = loadNotes();
  setupScreen.style.display = 'none';
  gameScreen.classList.add('active');
  document.body.classList.add('in-game');

  await requestNotifPermission();
});

function applyTeamColors() {
  const [a, b] = state.teams;
  const pa = $('panel-a'), pb = $('panel-b');
  pa.style.background = a.color;
  pb.style.background = b.color;
  const tcA = textColor(a.color), tcB = textColor(b.color);
  pa.style.color = tcA;
  pb.style.color = tcB;
  $('label-a').textContent = a.name;
  $('label-b').textContent = b.name;
  pa.querySelectorAll('.action-btn').forEach(b => b.style.color = tcA);
  pb.querySelectorAll('.action-btn').forEach(b => b.style.color = tcB);
}

/* ── Timer ───────────────────────────────── */
function tick() {
  const elapsed = Math.floor((Date.now() - state.startEpoch) / 1000);
  state.remaining = Math.max(0, state.remainingAtStart - elapsed);
  state.elapsedSeconds = state.totalSeconds - state.remaining;

  clockEl.textContent = fmt(state.remaining);
  updateClockColor();
  periodEl.textContent = state.currentHalf === 1 ? '1st Half' : '2nd Half';

  saveState();

  if (state.remaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    state.running = false;
    btnPause.disabled = true;
    clockEl.classList.add('danger');

    if (state.currentHalf === 1) {
      statusEl.textContent = 'Half Time';
      btnPlay.disabled = false;  // pressing play will start 2nd half
    } else {
      statusEl.textContent = 'Full Time';
      btnPlay.disabled = true;
      clearSavedState();
    }
  }
}

function startTimer() {
  if (state.running) return;

  // Transition from end of 1st half into 2nd half
  if (state.remaining <= 0 && state.currentHalf === 1) {
    state.currentHalf = 2;
    state.remaining = state.totalSeconds;
    state.elapsedSeconds = 0;
    clockEl.textContent = fmt(state.remaining);
    clockEl.classList.remove('warning', 'danger');
    periodEl.textContent = '2nd Half';
  }

  if (state.remaining <= 0) return;

  state.startEpoch = Date.now();
  state.remainingAtStart = state.remaining;
  state.running = true;
  statusEl.textContent = 'Running';
  btnPlay.disabled  = true;
  btnPause.disabled = false;
  scheduleNotifications();
  saveState();
  timerInterval = setInterval(tick, 500);
}

function pauseTimer() {
  if (!state.running) return;
  clearInterval(timerInterval);
  timerInterval = null;
  const elapsed = Math.floor((Date.now() - state.startEpoch) / 1000);
  state.remaining = Math.max(0, state.remainingAtStart - elapsed);
  state.elapsedSeconds = state.totalSeconds - state.remaining;
  state.startEpoch = null;
  state.running = false;
  cancelNotifications();
  statusEl.textContent = 'Paused';
  btnPlay.disabled  = false;
  btnPause.disabled = true;
  saveState();
}

function updateClockColor() {
  const pct = state.remaining / state.totalSeconds;
  clockEl.classList.remove('warning','danger');
  if (pct <= 0.1)       clockEl.classList.add('danger');
  else if (pct <= 0.25) clockEl.classList.add('warning');
}

/* ── Persistence ─────────────────────────── */
function saveState() {
  try {
    localStorage.setItem('refclock', JSON.stringify({
      teams: state.teams,
      events: state.events,
      totalSeconds: state.totalSeconds,
      currentHalf: state.currentHalf,
      remaining: state.remaining,
      remainingAtStart: state.remainingAtStart,
      startEpoch: state.startEpoch,
      running: state.running,
      elapsedSeconds: state.elapsedSeconds,
    }));
  } catch(err) { console.warn('saveState failed (storage full or unavailable):', err); }
}

function clearSavedState() {
  localStorage.removeItem('refclock');
}

function restoreSavedGame() {
  try {
    const raw = localStorage.getItem('refclock');
    if (!raw) return;
    const s = JSON.parse(raw);

    // Sanitize restored data — it can be edited or corrupted in localStorage.
    if (!s || !Array.isArray(s.teams) || s.teams.length < 2) {
      clearSavedState();
      return;
    }
    const defaults = ['#0566d9', '#dc2626'];
    state.teams = s.teams.slice(0, 2).map((t, i) => ({
      name:  typeof t.name === 'string' ? t.name : (i === 0 ? 'Home' : 'Away'),
      color: safeColor(t.color, defaults[i]),
      score: Number.isFinite(t.score) ? t.score : 0,
    }));
    state.events = Array.isArray(s.events) ? s.events : [];
    state.totalSeconds = Number.isFinite(s.totalSeconds) && s.totalSeconds > 0 ? s.totalSeconds : 2700;
    state.currentHalf = s.currentHalf === 2 ? 2 : 1;

    const wasRunning = !!(s.running && s.startEpoch);
    if (wasRunning) {
      const elapsed = Math.floor((Date.now() - s.startEpoch) / 1000);
      state.remaining = Math.max(0, s.remainingAtStart - elapsed);
      state.elapsedSeconds = state.totalSeconds - state.remaining;
    } else {
      state.remaining = s.remaining;
      state.elapsedSeconds = s.elapsedSeconds || 0;
    }
    state.remainingAtStart = state.remaining;
    state.startEpoch = null;
    state.running = false;

    applyTeamColors();
    renderScores();
    state.events.forEach(ev => addEventToLog(ev.team, ev));
    clockEl.textContent = fmt(state.remaining);
    updateClockColor();
    periodEl.textContent = state.currentHalf === 1 ? '1st Half' : '2nd Half';

    $('notes-ingame').value = loadNotes();
    setupScreen.style.display = 'none';
    gameScreen.classList.add('active');
    document.body.classList.add('in-game');

    if (state.remaining <= 0) {
      clockEl.classList.add('danger');
      btnPause.disabled = true;
      if (state.currentHalf === 1) {
        statusEl.textContent = 'Half Time';
        btnPlay.disabled = false;
      } else {
        statusEl.textContent = 'Full Time';
        btnPlay.disabled = true;
      }
    } else if (wasRunning) {
      startTimer();
    } else {
      statusEl.textContent = 'Paused';
      btnPlay.disabled = false;
      btnPause.disabled = true;
    }
  } catch(err) {
    console.warn('restoreSavedGame failed; clearing corrupted state:', err);
    clearSavedState();
  }
}

/* ── Notifications ───────────────────────── */
async function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

function scheduleNotifications() {
  cancelNotifications();
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (!sw) return;

  const score = `${state.teams[0].name} ${state.teams[0].score} – ${state.teams[1].score} ${state.teams[1].name}`;
  const isFirstHalf = state.currentHalf === 1;

  sw.postMessage({
    type: 'SCHEDULE_NOTIF',
    tag: isFirstHalf ? 'refclock-half' : 'refclock-full',
    delay: state.remainingAtStart * 1000,
    title: isFirstHalf ? 'Half Time ⚽' : 'Full Time 🏁',
    body: score,
  });
}

function cancelNotifications() {
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (sw) sw.postMessage({ type: 'CANCEL_NOTIFS' });
}

/* ── Visibility change (re-sync on app resume) ── */
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !state.running || !state.startEpoch) return;

  const elapsed = Math.floor((Date.now() - state.startEpoch) / 1000);
  state.remaining = Math.max(0, state.remainingAtStart - elapsed);
  state.elapsedSeconds = state.totalSeconds - state.remaining;
  clockEl.textContent = fmt(state.remaining);
  updateClockColor();
  periodEl.textContent = state.currentHalf === 1 ? '1st Half' : '2nd Half';

  if (state.remaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    state.running = false;
    btnPause.disabled = true;
    clockEl.classList.add('danger');
    if (state.currentHalf === 1) {
      statusEl.textContent = 'Half Time';
      btnPlay.disabled = false;
    } else {
      statusEl.textContent = 'Full Time';
      btnPlay.disabled = true;
      clearSavedState();
    }
  } else {
    // Re-schedule notifications in case the SW was killed while backgrounded
    scheduleNotifications();
  }
});

btnPlay.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnEndGame.addEventListener('click', showEndGame);

/* ── Stoppage time ───────────────────────── */
function adjustTime(deltaSecs) {
  if (state.running) {
    const elapsed = Math.floor((Date.now() - state.startEpoch) / 1000);
    const newRemaining = Math.max(0, (state.remainingAtStart - elapsed) + deltaSecs);
    state.remainingAtStart = elapsed + newRemaining;
    state.remaining = newRemaining;
    scheduleNotifications();
  } else {
    state.remaining = Math.max(0, state.remaining + deltaSecs);
  }

  state.elapsedSeconds = state.totalSeconds - state.remaining;
  clockEl.textContent = fmt(state.remaining);
  updateClockColor();

  // Re-enable play if time was added to a stopped-at-zero clock
  if (!state.running && state.remaining > 0) {
    btnPlay.disabled = false;
    clockEl.classList.remove('danger');
    updateClockColor();
    if (statusEl.textContent === 'Half Time' || statusEl.textContent === 'Full Time') {
      statusEl.textContent = 'Paused';
    }
  }

  saveState();
}

function stoppageSecs() {
  return Math.max(1, parseInt($('stoppage-secs').value) || 30);
}

$('btn-stoppage').addEventListener('click', () => adjustTime(stoppageSecs()));
$('btn-retract').addEventListener('click', () => adjustTime(-stoppageSecs()));

/* ── Modal ───────────────────────────────── */
let pendingEvent = null; // { team: 0|1, type: 'goal'|'card' }
let selectedCard = 'yellow';

function openModal(team, type) {
  pendingEvent = { team, type };
  modalPlayer.value = '';
  modalTitle.textContent = `${type === 'goal' ? '⚽ Goal' : '🟨 Card'} — ${state.teams[team].name}`;
  cardTypeField.style.display = type === 'card' ? '' : 'none';
  selectedCard = 'yellow';
  btnYellow.classList.add('selected');
  btnRed.classList.remove('selected');
  modalOverlay.classList.add('show');
  setTimeout(() => modalPlayer.focus(), 100);
}

function closeModal() {
  modalOverlay.classList.remove('show');
  pendingEvent = null;
}

btnYellow.addEventListener('click', () => {
  selectedCard = 'yellow';
  btnYellow.classList.add('selected');
  btnRed.classList.remove('selected');
});

btnRed.addEventListener('click', () => {
  selectedCard = 'red';
  btnRed.classList.add('selected');
  btnYellow.classList.remove('selected');
});

modalCancel.addEventListener('click', closeModal);

modalConfirm.addEventListener('click', () => {
  if (!pendingEvent) return;
  const { team, type } = pendingEvent;
  const player = modalPlayer.value.trim() || null;
  const cardType = type === 'card' ? selectedCard : null;

  const event = {
    team,
    type,
    player,
    cardType,
    elapsed: state.elapsedSeconds,
    timestamp: elapsedLabel(),
  };

  state.events.push(event);
  if (type === 'goal') {
    state.teams[team].score++;
    renderScores();
  }
  addEventToLog(team, event);
  saveState();
  closeModal();
});

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

$('goal-a').addEventListener('click', () => openModal(0, 'goal'));
$('card-a').addEventListener('click', () => openModal(0, 'card'));
$('goal-b').addEventListener('click', () => openModal(1, 'goal'));
$('card-b').addEventListener('click', () => openModal(1, 'card'));

/* ── Event log rendering ─────────────────── */
// Inline-SVG/markup icons (no emoji) — consistent with the rest of the UI and
// safe to inject: the markup here is static, never user-controlled.
function eventIcon(ev) {
  if (ev.type === 'goal') {
    return '<svg class="ev-ico ev-ball" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55z"/><path d="M12 7v-4"/><path d="M15 16l2.5 3"/><path d="M14.26 10.45l3.74 -1.45"/><path d="M9 16l-2.5 3"/><path d="M9.74 10.45l-3.74 -1.45"/></svg>';
  }
  const cls = ev.cardType === 'red' ? 'ev-card-r' : 'ev-card-y';
  return `<span class="ev-ico ev-card ${cls}" aria-hidden="true"></span>`;
}

function eventLabel(ev) {
  let label = '';
  if (ev.player) label += `#${ev.player}`;
  if (ev.type === 'card') label += ev.player ? ` ${ev.cardType}` : ev.cardType;
  return label || (ev.type === 'goal' ? 'Goal' : ev.cardType + ' card');
}

function addEventToLog(team, ev) {
  const log = team === 0 ? $('log-a') : $('log-b');
  const item = document.createElement('div');
  item.className = 'event-item';
  item.innerHTML = `
    <span class="event-icon">${eventIcon(ev)}</span>
    <span class="event-detail">${escapeHTML(eventLabel(ev))}</span>
    <span class="event-time">${escapeHTML(ev.timestamp)}</span>
  `;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function renderScores() {
  $('score-a').textContent = state.teams[0].score;
  $('score-b').textContent = state.teams[1].score;
}

// Shared renderer for the stats/detail event columns (end-game summary + history detail).
function renderEventList(evts) {
  if (!evts.length) return `<div class="no-events">—</div>`;
  return evts.map(ev => `
    <div class="stats-event-item">
      <span class="s-icon">${eventIcon(ev)}</span>
      <span class="s-detail">${escapeHTML(eventLabel(ev))}</span>
      <span class="s-time">${escapeHTML(ev.timestamp)}</span>
    </div>
  `).join('');
}

/* ── End Game ────────────────────────────── */
function showEndGame() {
  pauseTimer();
  cancelNotifications();
  clearSavedState();

  const [a, b] = state.teams;

  $('final-scoreboard').innerHTML = `
    <div class="final-team" style="background:${escapeHTML(a.color)};color:${textColor(a.color)}">
      <div class="final-team-side">Home</div>
      <div class="final-team-name">${escapeHTML(a.name)}</div>
      <div class="final-score">${escapeHTML(a.score)}</div>
    </div>
    <div class="final-vs">FT</div>
    <div class="final-team" style="background:${escapeHTML(b.color)};color:${textColor(b.color)}">
      <div class="final-team-side">Away</div>
      <div class="final-team-name">${escapeHTML(b.name)}</div>
      <div class="final-score">${escapeHTML(b.score)}</div>
    </div>
  `;

  const evA = state.events.filter(e => e.team === 0);
  const evB = state.events.filter(e => e.team === 1);

  $('stats-row').innerHTML = `
    <div class="stats-team-col">
      <div class="col-header" style="color:${escapeHTML(a.color)}">${escapeHTML(a.name)}</div>
      ${renderEventList(evA)}
    </div>
    <div class="stats-team-col">
      <div class="col-header" style="color:${escapeHTML(b.color)}">${escapeHTML(b.name)}</div>
      ${renderEventList(evB)}
    </div>
  `;

  $('notes-endgame').value = loadNotes();
  $('btn-save-game').style.display = currentUser ? '' : 'none';
  endgameOverlay.classList.add('show');
}

function showSavedBadge(message = 'Saved', isError = false) {
  let badge = $('saved-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'saved-badge';
    endgameOverlay.appendChild(badge);
  }
  badge.textContent = message;
  badge.classList.toggle('error', isError);
  badge.classList.add('show');
  setTimeout(() => badge.classList.remove('show'), 2500);
}

$('btn-save-game').addEventListener('click', async () => {
  if (!currentUser) return;
  const btn = $('btn-save-game');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  const [a, b] = state.teams;
  const record = {
    user_id:           currentUser.id,
    home_team:         a.name,
    away_team:         b.name,
    home_score:        a.score,
    away_score:        b.score,
    duration_per_half: state.totalSeconds,
    events:            state.events,
    notes:             $('notes-endgame').value,
  };
  const error = await SupabaseAPI.saveGame(record);
  if (error) {
    console.error('saveGame failed:', error);
    btn.disabled = false;
    btn.textContent = 'Save Game';
    showSavedBadge('Save failed — try again', true);
  } else {
    btn.textContent = 'Saved ✓';
    showSavedBadge();
  }
});

btnNewGame.addEventListener('click', () => {
  endgameOverlay.classList.remove('show');
  gameScreen.classList.remove('active');
  saveNotes('');
  const saveBtn = $('btn-save-game');
  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Game';
  setupScreen.style.display = '';
  document.body.classList.remove('in-game');
  showView('timer');
});

/* ── Service worker ─────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.error('SW registration failed:', err));
}

/* ── Restore on load ────────────────────── */
restoreSavedGame();

/* ── Wake lock ───────────────────────────── */
let wakeLock = null;
btnPlay.addEventListener('click', async () => {
  try {
    if ('wakeLock' in navigator)
      wakeLock = await navigator.wakeLock.request('screen');
  } catch(_) {}
});

/* ── Auth UI ─────────────────────────────── */
let currentUser = null;

function setAuthState(user) {
  currentUser = user;
  if (user) {
    $('auth-signed-out').style.display = 'none';
    $('auth-signed-in').style.display  = '';
    $('account-email').textContent = user.email;
    closeAuthModal();
  } else {
    $('auth-signed-out').style.display = '';
    $('auth-signed-in').style.display  = 'none';
    closeAccountMenu();
  }
  // History is always reachable now; refresh it if it's the current view.
  if ($('history-overlay').classList.contains('show')) loadHistory();
}

/* Account popover (member icon → email + sign out) */
function closeAccountMenu() {
  const menu = $('account-menu');
  if (menu) menu.hidden = true;
  const btn = $('btn-account');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

$('btn-account').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = $('account-menu');
  const willOpen = menu.hidden;
  menu.hidden = !willOpen;
  $('btn-account').setAttribute('aria-expanded', String(willOpen));
});

// Dismiss the popover when clicking anywhere outside it.
document.addEventListener('click', (e) => {
  const menu = $('account-menu');
  if (menu && !menu.hidden && !e.target.closest('#auth-signed-in')) closeAccountMenu();
});

function openAuthModal(panel) {
  showAuthPanel(panel || 'signin');
  $('auth-modal').classList.add('show');
}

function closeAuthModal() {
  $('auth-modal').classList.remove('show');
}

function showAuthPanel(name) {
  ['signin', 'signup', 'reset'].forEach(p => {
    $(`panel-${p}`).style.display = p === name ? '' : 'none';
    const tab = $(`tab-${p}`);
    if (tab) tab.classList.toggle('selected', p === name);
  });
  ['si-error', 'su-error', 'reset-msg'].forEach(id => {
    const el = $(id);
    if (el) el.style.display = 'none';
  });
}

function setAuthBtnLoading(id, loading, label) {
  const btn = $(id);
  btn.disabled    = loading;
  btn.textContent = loading ? '…' : label;
}

$('btn-signin-show').addEventListener('click', () => openAuthModal('signin'));
$('btn-auth-close').addEventListener('click', closeAuthModal);
$('auth-modal').addEventListener('click', e => { if (e.target === $('auth-modal')) closeAuthModal(); });
$('tab-signin').addEventListener('click', () => showAuthPanel('signin'));
$('tab-signup').addEventListener('click', () => showAuthPanel('signup'));
$('btn-show-reset').addEventListener('click', () => showAuthPanel('reset'));
$('btn-reset-back').addEventListener('click', () => showAuthPanel('signin'));

$('btn-do-signin').addEventListener('click', async () => {
  const email    = $('si-email').value.trim();
  const password = $('si-password').value;
  if (!email || !password) return;
  setAuthBtnLoading('btn-do-signin', true, 'Sign In');
  const { error } = await SupabaseAPI.signInWithPassword(email, password);
  setAuthBtnLoading('btn-do-signin', false, 'Sign In');
  if (error) {
    const el = $('si-error');
    el.textContent   = error.message.includes('Invalid') ? 'Incorrect email or password.' : error.message;
    el.style.display = '';
  }
});

$('btn-do-signup').addEventListener('click', async () => {
  const email    = $('su-email').value.trim();
  const password = $('su-password').value;
  const confirm  = $('su-confirm').value;
  const el       = $('su-error');
  if (!email || !password) return;
  if (password !== confirm) {
    el.textContent = 'Passwords do not match.';
    el.style.display = '';
    return;
  }
  if (password.length < 6) {
    el.textContent = 'Password must be at least 6 characters.';
    el.style.display = '';
    return;
  }
  setAuthBtnLoading('btn-do-signup', true, 'Create Account');
  const { error } = await SupabaseAPI.signUp(email, password);
  setAuthBtnLoading('btn-do-signup', false, 'Create Account');
  if (error) {
    el.textContent   = error.message;
    el.style.display = '';
  } else {
    el.style.color   = '#4ade80';
    el.textContent   = 'Account created! Check your email to confirm, then sign in.';
    el.style.display = '';
  }
});

$('btn-do-reset').addEventListener('click', async () => {
  const email = $('reset-email').value.trim();
  if (!email) return;
  setAuthBtnLoading('btn-do-reset', true, 'Send Reset Email');
  const error = await SupabaseAPI.resetPassword(email);
  setAuthBtnLoading('btn-do-reset', false, 'Send Reset Email');
  const msg = $('reset-msg');
  msg.style.color   = error ? '#f87171' : '#4ade80';
  msg.textContent   = error ? 'Error — try again.' : 'Reset email sent — check your inbox.';
  msg.style.display = '';
});

$('btn-signout').addEventListener('click', async () => {
  await SupabaseAPI.signOut();
  setAuthState(null);
});

SupabaseAPI.onAuthStateChange(user => setAuthState(user));

SupabaseAPI.getUser().then(user => { if (user) setAuthState(user); });

/* ── History ─────────────────────────────────── */
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadHistory() {
  const list = $('history-list');

  // History is browsable while logged out — prompt them to create an account to save.
  if (!currentUser) {
    list.innerHTML = `
      <div class="history-signin-prompt">
        <svg class="prompt-icon icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
        <div class="prompt-title">Save your match history</div>
        <div class="prompt-text">Create a free account to save games and revisit scores, cards, and notes any time.</div>
        <button class="prompt-btn" id="history-signup-btn">Sign In / Sign Up</button>
      </div>`;
    const signupBtn = $('history-signup-btn');
    if (signupBtn) signupBtn.addEventListener('click', () => openAuthModal('signup'));
    return;
  }

  list.innerHTML = '<div class="history-loading">Loading…</div>';

  const { data: games, error } = await SupabaseAPI.fetchGames();
  if (error) {
    console.error('fetchGames failed:', error);
    list.innerHTML = '<div class="history-empty">Couldn’t load your games. Check your connection and try again.</div>';
    return;
  }
  if (!games.length) {
    list.innerHTML = '<div class="history-empty">No saved games yet.</div>';
    return;
  }

  list.innerHTML = games.map((g, i) => `
    <div class="history-item" data-index="${i}">
      <div class="history-item-score">
        <span>${escapeHTML(g.home_team)}</span>
        <span>${escapeHTML(g.home_score)} – ${escapeHTML(g.away_score)}</span>
        <span>${escapeHTML(g.away_team)}</span>
      </div>
      <div class="history-item-meta">${escapeHTML(fmtDate(g.created_at))}</div>
      ${g.notes ? `<div class="history-item-notes">${escapeHTML(g.notes)}</div>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', () => openGameDetail(games[+el.dataset.index]));
  });
}

function openGameDetail(g) {
  const events = Array.isArray(g.events) ? g.events : [];
  const homeEvts = events.filter(e => e.team === 0);
  const awayEvts = events.filter(e => e.team === 1);

  $('game-detail-content').innerHTML = `
    <div class="final-scoreboard" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px">
      <div style="font-weight:900;font-size:1.1rem">${escapeHTML(g.home_team)}</div>
      <div style="font-size:1.8rem;font-weight:900">${escapeHTML(g.home_score)} – ${escapeHTML(g.away_score)}</div>
      <div style="font-weight:900;font-size:1.1rem">${escapeHTML(g.away_team)}</div>
    </div>
    <div style="font-size:0.65rem;color:#555;letter-spacing:1px;text-align:center;margin-bottom:16px">${escapeHTML(fmtDate(g.created_at))}</div>
    <div class="stats-row">
      <div class="stats-team-col">
        <div class="col-header">${escapeHTML(g.home_team)}</div>
        ${renderEventList(homeEvts)}
      </div>
      <div class="stats-team-col">
        <div class="col-header">${escapeHTML(g.away_team)}</div>
        ${renderEventList(awayEvts)}
      </div>
    </div>
    ${g.notes ? `<div style="margin-top:16px;font-size:0.8rem;color:#888;font-style:italic;padding:10px;background:#16213e;border-radius:8px">${escapeHTML(g.notes).replace(/\n/g,'<br>')}</div>` : ''}
  `;

  $('game-detail-overlay').classList.add('show');
}

/* ── Bottom-nav router ───────────────────────── */
// The nav routes between three "home shell" views. Timer = setup screen (the
// base layer); History and Settings are overlays shown on top of it. The nav
// itself is a persistent fixed element, so it replaces the old per-overlay ✕.
const navBtns = {
  timer:    $('btn-nav-timer'),
  history:  $('btn-history'),
  settings: $('btn-help'),
};

function setNavActive(view) {
  Object.entries(navBtns).forEach(([key, btn]) => {
    if (!btn) return;
    const active = key === view;
    btn.classList.toggle('nav-btn-active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
}

function showView(view) {
  $('game-detail-overlay').classList.remove('show');
  $('history-overlay').classList.toggle('show', view === 'history');
  $('help-overlay').classList.toggle('show', view === 'settings');
  setNavActive(view);
  if (view === 'history') loadHistory();
  else if (view === 'settings') renderHelp();
}

navBtns.timer.addEventListener('click', () => showView('timer'));
navBtns.history.addEventListener('click', () => showView('history'));
navBtns.settings.addEventListener('click', () => showView('settings'));

// Drill-in game detail sits above the history list; Back returns to it.
$('btn-game-detail-back').addEventListener('click', () => {
  $('game-detail-overlay').classList.remove('show');
});

/* ── Help / Changelog overlay ────────────────── */
function renderHelp() {
  const { APP_VERSION, CHANGELOG } = window.RefClockVersion;
  const list = $('help-list');
  list.textContent = '';

  const banner = document.createElement('div');
  banner.className = 'help-version-banner';
  const bannerLabel = document.createElement('span');
  bannerLabel.className = 'help-version-banner-label';
  bannerLabel.textContent = 'Current version';
  const bannerValue = document.createElement('span');
  bannerValue.className = 'help-version-banner-value';
  bannerValue.textContent = `v${APP_VERSION}`;
  banner.append(bannerLabel, bannerValue);
  list.append(banner);

  const sectionLabel = document.createElement('div');
  sectionLabel.className = 'help-section-label';
  sectionLabel.textContent = 'Changelog';
  list.append(sectionLabel);

  CHANGELOG.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'changelog-item';

    const head = document.createElement('div');
    head.className = 'changelog-item-head';
    const ver = document.createElement('span');
    ver.className = 'changelog-item-version';
    ver.textContent = `v${entry.version}`;
    const date = document.createElement('span');
    date.className = 'changelog-item-date';
    date.textContent = entry.date;
    head.append(ver, date);

    const changes = document.createElement('ul');
    changes.className = 'changelog-item-changes';
    entry.changes.forEach(c => {
      const li = document.createElement('li');
      li.textContent = c;
      changes.append(li);
    });

    item.append(head, changes);
    list.append(item);
  });

  const divider = document.createElement('div');
  divider.className = 'help-divider';
  list.append(divider);

  const linksLabel = document.createElement('div');
  linksLabel.className = 'help-section-label';
  linksLabel.textContent = 'More';
  list.append(linksLabel);

  const privacyLink = document.createElement('a');
  privacyLink.className = 'help-link';
  privacyLink.href = 'privacy.html';
  privacyLink.textContent = 'Privacy policy';
  list.append(privacyLink);

  const accountLink = document.createElement('a');
  accountLink.className = 'help-account-link';
  accountLink.href = 'delete-account.html';
  accountLink.textContent = 'Delete account & data';
  list.append(accountLink);
}

/* ── Notes ───────────────────────────────────── */
function loadNotes() {
  return localStorage.getItem('refclock_notes') || '';
}

function saveNotes(text) {
  localStorage.setItem('refclock_notes', text);
}

$('notes-ingame').addEventListener('input', () => {
  saveNotes($('notes-ingame').value);
});

$('notes-endgame').addEventListener('input', () => {
  saveNotes($('notes-endgame').value);
});
