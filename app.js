/* ── State ───────────────────────────────── */
const state = {
  teams: [
    { name: 'Home', color: '#1d4ed8', score: 0 },
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

colorA.addEventListener('input', () => swatchA.style.background = colorA.value);
colorB.addEventListener('input', () => swatchB.style.background = colorB.value);

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
  } catch(_) {}
}

function clearSavedState() {
  localStorage.removeItem('refclock');
}

function restoreSavedGame() {
  try {
    const raw = localStorage.getItem('refclock');
    if (!raw) return;
    const s = JSON.parse(raw);

    state.teams = s.teams;
    state.events = s.events || [];
    state.totalSeconds = s.totalSeconds;
    state.currentHalf = s.currentHalf || 1;

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
  } catch(_) {}
}

/* ── Notifications ───────────────────────── */
async function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

function scheduleNotifications() {
  cancelNotifications();
  if (Notification.permission !== 'granted') return;
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
function eventIcon(ev) {
  if (ev.type === 'goal') return '⚽';
  return ev.cardType === 'red' ? '🟥' : '🟨';
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
    <span class="event-detail">${eventLabel(ev)}</span>
    <span class="event-time">${ev.timestamp}</span>
  `;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function renderScores() {
  $('score-a').textContent = state.teams[0].score;
  $('score-b').textContent = state.teams[1].score;
}

/* ── End Game ────────────────────────────── */
function showEndGame() {
  pauseTimer();
  cancelNotifications();
  clearSavedState();

  const [a, b] = state.teams;

  $('final-scoreboard').innerHTML = `
    <div class="final-team" style="background:${a.color};color:${textColor(a.color)}">
      <div class="final-team-name">${a.name}</div>
      <div class="final-score">${a.score}</div>
    </div>
    <div class="final-vs">–</div>
    <div class="final-team" style="background:${b.color};color:${textColor(b.color)}">
      <div class="final-team-name">${b.name}</div>
      <div class="final-score">${b.score}</div>
    </div>
  `;

  const evA = state.events.filter(e => e.team === 0);
  const evB = state.events.filter(e => e.team === 1);

  function renderStatEvents(evts) {
    if (!evts.length) return `<div class="no-events">—</div>`;
    return evts.map(ev => `
      <div class="stats-event-item">
        <span class="s-icon">${eventIcon(ev)}</span>
        <span class="s-detail">${eventLabel(ev)}</span>
        <span class="s-time">${ev.timestamp}</span>
      </div>
    `).join('');
  }

  $('stats-row').innerHTML = `
    <div class="stats-team-col">
      <div class="col-header" style="color:${a.color}">${a.name}</div>
      ${renderStatEvents(evA)}
    </div>
    <div class="stats-team-col">
      <div class="col-header" style="color:${b.color}">${b.name}</div>
      ${renderStatEvents(evB)}
    </div>
  `;

  $('notes-endgame').value = loadNotes();
  $('btn-save-game').style.display = currentUser ? '' : 'none';
  endgameOverlay.classList.add('show');
}

function showSavedBadge() {
  let badge = $('saved-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'saved-badge';
    endgameOverlay.appendChild(badge);
  }
  badge.textContent = 'Saved';
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
    btn.disabled = false;
    btn.textContent = 'Save Game';
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
});

/* ── Service worker ─────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/refclock/sw.js').catch(() => {});
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
    $('auth-user-email').textContent   = user.email;
    $('btn-history').style.display     = '';
    closeAuthModal();
  } else {
    $('auth-signed-out').style.display = '';
    $('auth-signed-in').style.display  = 'none';
    $('btn-history').style.display     = 'none';
  }
}

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

async function openHistory() {
  const list = $('history-list');
  list.innerHTML = '<div class="history-loading">Loading…</div>';
  $('history-overlay').classList.add('show');

  const games = await SupabaseAPI.fetchGames();
  if (!games.length) {
    list.innerHTML = '<div class="history-empty">No saved games yet.</div>';
    return;
  }

  list.innerHTML = games.map((g, i) => `
    <div class="history-item" data-index="${i}">
      <div class="history-item-score">
        <span>${g.home_team}</span>
        <span>${g.home_score} – ${g.away_score}</span>
        <span>${g.away_team}</span>
      </div>
      <div class="history-item-meta">${fmtDate(g.created_at)}</div>
      ${g.notes ? `<div class="history-item-notes">${g.notes.replace(/</g,'&lt;')}</div>` : ''}
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

  function renderDetailEvents(evts) {
    if (!evts.length) return `<div class="no-events">—</div>`;
    return evts.map(ev => `
      <div class="stats-event-item">
        <span class="s-icon">${eventIcon(ev)}</span>
        <span class="s-detail">${eventLabel(ev)}</span>
        <span class="s-time">${ev.timestamp}</span>
      </div>
    `).join('');
  }

  $('game-detail-content').innerHTML = `
    <div class="final-scoreboard" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px">
      <div style="font-weight:900;font-size:1.1rem">${g.home_team}</div>
      <div style="font-size:1.8rem;font-weight:900">${g.home_score} – ${g.away_score}</div>
      <div style="font-weight:900;font-size:1.1rem">${g.away_team}</div>
    </div>
    <div style="font-size:0.65rem;color:#555;letter-spacing:1px;text-align:center;margin-bottom:16px">${fmtDate(g.created_at)}</div>
    <div class="stats-row">
      <div class="stats-team-col">
        <div class="col-header">${g.home_team}</div>
        ${renderDetailEvents(homeEvts)}
      </div>
      <div class="stats-team-col">
        <div class="col-header">${g.away_team}</div>
        ${renderDetailEvents(awayEvts)}
      </div>
    </div>
    ${g.notes ? `<div style="margin-top:16px;font-size:0.8rem;color:#888;font-style:italic;padding:10px;background:#16213e;border-radius:8px">${g.notes.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>` : ''}
  `;

  $('game-detail-overlay').classList.add('show');
}

$('btn-history').addEventListener('click', openHistory);
$('btn-history-close').addEventListener('click', () => {
  $('history-overlay').classList.remove('show');
});
$('btn-game-detail-back').addEventListener('click', () => {
  $('game-detail-overlay').classList.remove('show');
});

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
