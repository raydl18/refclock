/* ── State ───────────────────────────────── */
const state = {
  teams: [
    { name: 'Home', color: '#1d4ed8', score: 0 },
    { name: 'Away', color: '#dc2626', score: 0 }
  ],
  events: [],          // { team, type, player, cardType, timestamp, elapsed }
  totalSeconds: 2700,
  remaining: 2700,
  remainingAtStart: 2700, // remaining when timer was last started
  startEpoch: null,       // Date.now() when timer was last started
  running: false,
  elapsedSeconds: 0,
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
  const e = state.elapsedSeconds;
  return `${pad(Math.floor(e/60))}'`;
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

  const halfPt = state.totalSeconds / 2;
  periodEl.textContent = state.elapsedSeconds <= halfPt ? '1st Half' : '2nd Half';

  saveState();

  if (state.remaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    state.running = false;
    statusEl.textContent = 'Full Time';
    btnPlay.disabled  = true;
    btnPause.disabled = true;
    clockEl.classList.add('danger');
    clearSavedState();
  }
}

function startTimer() {
  if (state.running || state.remaining <= 0) return;
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
    const halfPt = state.totalSeconds / 2;
    periodEl.textContent = state.elapsedSeconds <= halfPt ? '1st Half' : '2nd Half';

    setupScreen.style.display = 'none';
    gameScreen.classList.add('active');

    if (state.remaining <= 0) {
      statusEl.textContent = 'Full Time';
      btnPlay.disabled = true;
      btnPause.disabled = true;
      clockEl.classList.add('danger');
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

  const halfPt = state.totalSeconds / 2;
  const score = `${state.teams[0].name} ${state.teams[0].score} – ${state.teams[1].score} ${state.teams[1].name}`;

  if (state.remaining > halfPt) {
    sw.postMessage({
      type: 'SCHEDULE_NOTIF', tag: 'refclock-half',
      delay: (state.remainingAtStart - halfPt) * 1000,
      title: 'Half Time ⚽', body: score,
    });
  }
  sw.postMessage({
    type: 'SCHEDULE_NOTIF', tag: 'refclock-full',
    delay: state.remainingAtStart * 1000,
    title: 'Full Time 🏁', body: score,
  });
}

function cancelNotifications() {
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (sw) sw.postMessage({ type: 'CANCEL_NOTIFS' });
}

/* ── Visibility change (re-sync on app resume) ── */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.running && state.startEpoch) {
    const elapsed = Math.floor((Date.now() - state.startEpoch) / 1000);
    state.remaining = Math.max(0, state.remainingAtStart - elapsed);
    state.elapsedSeconds = state.totalSeconds - state.remaining;
    clockEl.textContent = fmt(state.remaining);
    updateClockColor();
    const halfPt = state.totalSeconds / 2;
    periodEl.textContent = state.elapsedSeconds <= halfPt ? '1st Half' : '2nd Half';
    if (state.remaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      state.running = false;
      statusEl.textContent = 'Full Time';
      btnPlay.disabled = true;
      btnPause.disabled = true;
      clockEl.classList.add('danger');
      clearSavedState();
    }
  }
});

btnPlay.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnEndGame.addEventListener('click', showEndGame);

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

  const goals   = t => state.events.filter(e => e.team === t && e.type === 'goal').length;
  const yellows = t => state.events.filter(e => e.team === t && e.cardType === 'yellow').length;
  const reds    = t => state.events.filter(e => e.team === t && e.cardType === 'red').length;

  $('stats-row').innerHTML = `
    <div class="stats-team-col">
      <div class="col-header" style="color:${a.color}">${a.name}</div>
      ${renderStatEvents(evA)}
      <div class="stats-event-item" style="margin-top:4px;opacity:0.6">
        <span class="s-icon">⚽</span><span class="s-detail">Goals</span><span class="s-time">${goals(0)}</span>
      </div>
      <div class="stats-event-item" style="opacity:0.6">
        <span class="s-icon">🟨</span><span class="s-detail">Yellows</span><span class="s-time">${yellows(0)}</span>
      </div>
      <div class="stats-event-item" style="opacity:0.6">
        <span class="s-icon">🟥</span><span class="s-detail">Reds</span><span class="s-time">${reds(0)}</span>
      </div>
    </div>
    <div class="stats-team-col">
      <div class="col-header" style="color:${b.color}">${b.name}</div>
      ${renderStatEvents(evB)}
      <div class="stats-event-item" style="margin-top:4px;opacity:0.6">
        <span class="s-icon">⚽</span><span class="s-detail">Goals</span><span class="s-time">${goals(1)}</span>
      </div>
      <div class="stats-event-item" style="opacity:0.6">
        <span class="s-icon">🟨</span><span class="s-detail">Yellows</span><span class="s-time">${yellows(1)}</span>
      </div>
      <div class="stats-event-item" style="opacity:0.6">
        <span class="s-icon">🟥</span><span class="s-detail">Reds</span><span class="s-time">${reds(1)}</span>
      </div>
    </div>
  `;

  endgameOverlay.classList.add('show');
}

btnNewGame.addEventListener('click', () => {
  endgameOverlay.classList.remove('show');
  gameScreen.classList.remove('active');
  setupScreen.style.display = '';
});

/* ── Service worker ─────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
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
  const signedOut = $('auth-signed-out');
  const form      = $('auth-form');
  const signedIn  = $('auth-signed-in');
  const msg       = $('auth-msg');
  if (user) {
    signedOut.style.display = 'none';
    form.style.display      = 'none';
    msg.style.display       = 'none';
    signedIn.style.display  = '';
    $('auth-user-email').textContent = user.email;
  } else {
    signedOut.style.display = '';
    form.style.display      = 'none';
    msg.style.display       = 'none';
    signedIn.style.display  = 'none';
  }
}

$('btn-signin-show').addEventListener('click', () => {
  $('auth-signed-out').style.display = 'none';
  $('auth-form').style.display = '';
  $('auth-email-input').focus();
});

$('btn-signin-cancel').addEventListener('click', () => {
  $('auth-form').style.display = 'none';
  $('auth-signed-out').style.display = '';
});

$('btn-signin-submit').addEventListener('click', async () => {
  const email = $('auth-email-input').value.trim();
  if (!email) return;
  const btn = $('btn-signin-submit');
  btn.disabled = true;
  btn.textContent = '...';
  const error = await SupabaseAPI.signIn(email);
  btn.disabled = false;
  btn.textContent = 'Send link';
  $('auth-form').style.display = 'none';
  const msg = $('auth-msg');
  msg.style.display = '';
  if (error) {
    msg.textContent = 'Error — try again';
    msg.style.color = '#f87171';
    setTimeout(() => { msg.style.display = 'none'; $('auth-signed-out').style.display = ''; }, 3000);
  } else {
    msg.textContent = 'Check your email';
    msg.style.color = '#4ade80';
  }
});

$('btn-signout').addEventListener('click', async () => {
  await SupabaseAPI.signOut();
  setAuthState(null);
});

SupabaseAPI.onAuthStateChange(setAuthState);
