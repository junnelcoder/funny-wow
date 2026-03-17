/* ==============================================
   StayClean — script.js
   Reward-Based Discipline / No-Habit Tracker
   Mechanics: XP · Levels · Badges · Streaks · Savings
============================================== */

/* ===================================================
   CONFIGURATION
=================================================== */
const LEVELS = [
  { xp: 0,    title: 'Beginner',       color: '#6b7594' },
  { xp: 50,   title: 'Determined',     color: '#4f8ef7' },
  { xp: 150,  title: 'Disciplined',    color: '#22d47a' },
  { xp: 300,  title: 'Strong Mind',    color: '#00c9b1' },
  { xp: 500,  title: 'Iron Will',      color: '#9b6dff' },
  { xp: 800,  title: 'Unbreakable',    color: '#f5c842' },
  { xp: 1200, title: 'Legend',         color: '#ff9f43' },
  { xp: 2000, title: 'Master',         color: '#ff5f5f' },
];

const BADGES = [
  { id: 'day1',    emoji: '🌱', name: '1 Day',       req: 'Log your first day',          check: (d,s) => d >= 1 },
  { id: 'day3',    emoji: '💪', name: '3 Days',       req: '3-day streak',                check: (d,s) => s >= 3 },
  { id: 'day7',    emoji: '🔥', name: '1 Week',       req: '7-day streak',                check: (d,s) => s >= 7 },
  { id: 'day14',   emoji: '⚡', name: '2 Weeks',      req: '14-day streak',               check: (d,s) => s >= 14 },
  { id: 'day30',   emoji: '🏆', name: '1 Month',      req: '30-day streak',               check: (d,s) => s >= 30 },
  { id: 'day60',   emoji: '💎', name: '2 Months',     req: '60-day streak',               check: (d,s) => s >= 60 },
  { id: 'day100',  emoji: '🌟', name: '100 Days',     req: '100-day streak',              check: (d,s) => s >= 100 },
  { id: 'day365',  emoji: '👑', name: '1 Year',       req: '365-day streak',              check: (d,s) => s >= 365 },
  { id: 'save100', emoji: '💰', name: '$100 Saved',   req: 'Save $100 total',             check: (d,s,sv) => sv >= 100 },
  { id: 'save500', emoji: '💵', name: '$500 Saved',   req: 'Save $500 total',             check: (d,s,sv) => sv >= 500 },
  { id: 'save1k',  emoji: '🤑', name: '$1K Saved',    req: 'Save $1,000 total',           check: (d,s,sv) => sv >= 1000 },
];

const QUOTES = [
  '"Every day clean is a victory." — You',
  '"The strongest people are not those who never break, but those who rebuild."',
  '"Discipline is choosing between what you want now and what you want most."',
  '"You don\'t have to be perfect, just consistent."',
  '"Each morning you wake up clean is a win. Stack the wins."',
  '"The cravings will pass. Your progress is permanent."',
  '"Progress, not perfection."',
  '"You\'ve survived every urge so far. That\'s 100%."',
  '"What you resist, you grow stronger than."',
  '"Today\'s discipline is tomorrow\'s freedom."',
];

const REWARD_MSGS = [
  'Keep going. You\'re building something real.',
  'Another clean day. That\'s real strength.',
  'Every check-in is a vote for the person you\'re becoming.',
  'You chose yourself today. That matters.',
  'The streak continues. Don\'t stop now.',
  'Feeling the urge? Look at your streak. Was it worth breaking?',
  'You\'re further along than yesterday. That\'s all that counts.',
];

const HABIT_ICONS = {
  gambling: '🎰', drinking: '🍺', smoking: '🚬',
  social: '📱', junkfood: '🍔', spending: '💸', custom: '🛡️'
};

/* ===================================================
   STORAGE
=================================================== */
const S = {
  get: k => { try { return JSON.parse(localStorage.getItem('sc_' + k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem('sc_' + k, JSON.stringify(v)),
};

function getData() {
  return S.get('data') || {
    habit: null, habitIcon: '🛡️', habitLabel: 'My Habit',
    dailySaving: 20,
    streak: 0, longestStreak: 0, totalDays: 0,
    totalXP: 0, totalSaved: 0,
    checkIns: [],       // array of date strings "YYYY-MM-DD"
    badges: [],         // array of badge ids earned
    lastCheckin: null,
  };
}
function saveData(d) { S.set('data', d); }
function today() { return new Date().toISOString().slice(0, 10); }
function formatDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ===================================================
   SCREEN ROUTING
=================================================== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ===================================================
   ONBOARDING
=================================================== */
let selectedHabit = null;

document.querySelectorAll('.habit-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.habit-pill').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedHabit = { id: btn.dataset.habit, icon: btn.dataset.icon, label: btn.textContent.trim() };
    document.getElementById('customHabit').value = '';
  });
});

function startJourney() {
  const custom = document.getElementById('customHabit').value.trim();
  let habit;
  if (custom) {
    habit = { id: 'custom', icon: '🛡️', label: custom };
  } else if (selectedHabit) {
    habit = selectedHabit;
  } else {
    alert('Please select or type a habit to quit.');
    return;
  }

  const saving = parseFloat(document.getElementById('dailySaving').value) || 20;
  const d = getData();
  d.habit = habit.id;
  d.habitIcon = habit.icon;
  d.habitLabel = habit.label;
  d.dailySaving = saving;
  saveData(d);

  renderHome();
  showScreen('screen-home');
}

/* ===================================================
   HOME / DASHBOARD
=================================================== */
function goHome() { renderHome(); showScreen('screen-home'); }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getLevelInfo(xp) {
  let lv = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { lv = i; break; }
  }
  const next = LEVELS[lv + 1];
  const pct  = next
    ? Math.round(((xp - LEVELS[lv].xp) / (next.xp - LEVELS[lv].xp)) * 100)
    : 100;
  return { level: lv + 1, title: LEVELS[lv].title, nextXP: next ? next.xp : null, pct };
}

function renderHome() {
  const d = getData();
  if (!d.habit) { showScreen('screen-onboard'); return; }

  // Header
  document.getElementById('dashGreeting').textContent  = getGreeting();
  document.getElementById('dashHabitName').textContent = 'No ' + d.habitLabel;
  document.getElementById('dashHabitIcon').textContent = d.habitIcon;

  // Hero ring (progress toward 365 days)
  const circ = 377;
  const pct  = Math.min(d.streak / 365, 1);
  const arc  = document.getElementById('heroArc');
  setTimeout(() => {
    arc.style.strokeDasharray = (pct * circ) + ' ' + ((1 - pct) * circ);
  }, 100);
  document.getElementById('heroDays').textContent = d.streak;
  document.getElementById('heroTitle').textContent = heroTitle(d.streak);
  document.getElementById('heroSub').textContent   = heroSub(d);
  document.getElementById('heroSavings').textContent = '$' + d.totalSaved.toFixed(0);

  // Check-in button
  const alreadyToday = d.lastCheckin === today();
  const btn  = document.getElementById('checkinBtn');
  const note = document.getElementById('checkinNote');
  const ctxt = document.getElementById('checkinText');
  if (alreadyToday) {
    btn.classList.add('done');
    ctxt.textContent = '✓ Checked In Today';
    note.textContent = 'Come back tomorrow to keep your streak!';
  } else {
    btn.classList.remove('done');
    ctxt.textContent = 'Check In Today';
    note.textContent = 'Tap to log your clean day & earn XP';
  }

  // XP bar
  const lv = getLevelInfo(d.totalXP);
  document.getElementById('xpLevel').textContent = 'Lv ' + lv.level;
  document.getElementById('xpTitle').textContent = lv.title;
  document.getElementById('xpPts').textContent   = d.totalXP + ' XP';
  document.getElementById('xpFill').style.width  = lv.pct + '%';
  document.getElementById('xpNext').textContent  = lv.nextXP
    ? (lv.nextXP - d.totalXP) + ' XP to next level'
    : 'MAX LEVEL';

  // Stats
  document.getElementById('statStreak').textContent = d.streak;
  document.getElementById('statXP').textContent     = d.totalXP;
  document.getElementById('statBadges').textContent = d.badges.length;

  // Quote
  document.getElementById('quoteText').textContent =
    QUOTES[Math.floor(Math.random() * QUOTES.length)];

  // Badges preview (first 4)
  renderBadgeGrid('badgeGridHome', d, 4);

  // Activity log
  renderActivityLog(d);
}

function heroTitle(streak) {
  if (streak === 0) return 'Day 0 — Just Starting';
  if (streak === 1) return 'Day 1 — The hardest step ✓';
  if (streak < 7)  return `Day ${streak} — Building Momentum`;
  if (streak < 30) return `Day ${streak} — Feeling Stronger`;
  if (streak < 100) return `Day ${streak} — Iron Discipline`;
  return `Day ${streak} — LEGENDARY 👑`;
}

function heroSub(d) {
  if (d.lastCheckin !== today()) return 'Check in today to keep your streak!';
  if (d.streak === 1) return 'First clean day logged. Keep going!';
  return `${d.streak}-day streak active 🔥`;
}

function renderBadgeGrid(elId, d, limit) {
  const el = document.getElementById(elId);
  const list = limit ? BADGES.slice(0, limit) : BADGES;
  el.innerHTML = list.map(b => {
    const unlocked = d.badges.includes(b.id);
    return `<div class="badge-item ${unlocked ? 'unlocked' : 'locked'}">
      <span class="badge-emoji">${b.emoji}</span>
      <span class="badge-name">${b.name}</span>
    </div>`;
  }).join('');
}

function renderActivityLog(d) {
  const el = document.getElementById('activityLog');
  const recent = d.checkIns.slice(-7).reverse();
  if (!recent.length) {
    el.innerHTML = '<p style="font-size:13px;color:var(--muted);padding:8px 0">No check-ins yet. Start today!</p>';
    return;
  }
  el.innerHTML = recent.map((date, i) => `
    <div class="log-row">
      <span class="log-dot"></span>
      <span class="log-date">${formatDate(date)}</span>
      <span class="log-xp">+${xpForDay(d.checkIns.length - i)} XP</span>
      <span class="log-streak">🔥 ${d.checkIns.length - i}d</span>
    </div>`).join('');
}

function xpForDay(dayNum) {
  // Base 50 + streak bonuses
  let xp = 50;
  if (dayNum >= 7)  xp += 25;
  if (dayNum >= 14) xp += 25;
  if (dayNum >= 30) xp += 50;
  return xp;
}

/* ===================================================
   AD GATE → CHECK-IN FLOW
=================================================== */
function triggerCheckin() {
  const d = getData();
  if (d.lastCheckin === today()) return;
  showScreen('screen-adgate');

  let secs = 5;
  const timerEl = document.getElementById('gateTimer');
  const fillEl  = document.getElementById('gateBarFill');
  timerEl.textContent = secs;

  let pct = 0;
  const fillTick = setInterval(() => {
    pct += 100 / (secs * 20);
    fillEl.style.width = Math.min(pct, 100) + '%';
  }, 50);

  const countTick = setInterval(() => {
    secs--;
    timerEl.textContent = secs;
    if (secs <= 0) {
      clearInterval(countTick);
      clearInterval(fillTick);
      fillEl.style.width = '100%';
      setTimeout(processCheckin, 350);
    }
  }, 1000);
}

/* ===================================================
   PROCESS CHECK-IN (the real reward logic)
=================================================== */
function processCheckin() {
  const d = getData();
  const t = today();

  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  if (d.lastCheckin === yStr || d.lastCheckin === null) {
    d.streak++;
  } else if (d.lastCheckin !== t) {
    d.streak = 1; // broken — restart
  }

  d.longestStreak = Math.max(d.longestStreak || 0, d.streak);
  d.totalDays++;
  d.lastCheckin = t;
  if (!d.checkIns.includes(t)) d.checkIns.push(t);

  // XP calculation
  const baseXP  = 50;
  let bonusXP   = 0;
  let bonusText = '';
  if (d.streak === 7)  { bonusXP = 50;  bonusText = '🔥 7-day streak bonus!'; }
  if (d.streak === 14) { bonusXP = 75;  bonusText = '⚡ 2-week streak bonus!'; }
  if (d.streak === 30) { bonusXP = 150; bonusText = '🏆 1-month streak bonus!'; }
  if (d.streak % 7 === 0 && d.streak > 0 && !bonusText) {
    bonusXP = 25; bonusText = '📅 Weekly bonus!';
  }
  const earnedXP = baseXP + bonusXP;
  d.totalXP += earnedXP;

  // Savings
  d.totalSaved = (d.totalSaved || 0) + (d.dailySaving || 20);

  // Badge check
  let newBadge = null;
  BADGES.forEach(b => {
    if (!d.badges.includes(b.id) && b.check(d.totalDays, d.streak, d.totalSaved)) {
      d.badges.push(b.id);
      newBadge = b;
    }
  });

  saveData(d);

  // Show reward screen
  showReward(d, earnedXP, bonusText, newBadge);
}

/* ===================================================
   REWARD SCREEN
=================================================== */
function showReward(d, xp, bonusText, newBadge) {
  showScreen('screen-reward');

  document.getElementById('rewardTitle').textContent  = d.streak === 1 ? 'Day 1 Started!' : 'Clean Day Logged! ✓';
  document.getElementById('rewardStreak').textContent = `🔥 ${d.streak}-Day Streak`;
  document.getElementById('rewardXP').textContent     = '+' + xp + ' XP';
  document.getElementById('rewardBonus').textContent  = bonusText || '';
  document.getElementById('rewardSavings').textContent = '$' + (d.dailySaving || 20).toFixed(0);
  document.getElementById('rewardTotal').textContent  = 'Total: $' + d.totalSaved.toFixed(0) + ' saved';
  document.getElementById('rewardMsg').textContent    = REWARD_MSGS[Math.floor(Math.random() * REWARD_MSGS.length)];

  if (newBadge) {
    const rev = document.getElementById('badgeReveal');
    rev.style.display = 'block';
    document.getElementById('badgeRevealIcon').textContent = newBadge.emoji;
    document.getElementById('badgeRevealName').textContent = newBadge.name;
    if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 80]);
  } else {
    document.getElementById('badgeReveal').style.display = 'none';
  }

  if (navigator.vibrate) navigator.vibrate(60);
}

/* ===================================================
   BADGE SCREEN
=================================================== */
function renderBadgesFull() {
  const d = getData();
  const el = document.getElementById('badgeFullGrid');
  el.innerHTML = BADGES.map(b => {
    const unlocked = d.badges.includes(b.id);
    return `<div class="badge-full-item ${unlocked ? 'unlocked' : 'locked'}">
      <div class="bfi-emoji">${b.emoji}</div>
      <div class="bfi-name">${b.name}</div>
      <div class="bfi-req">${unlocked ? '✓ Earned' : b.req}</div>
    </div>`;
  }).join('');
}

/* ===================================================
   SETTINGS SCREEN
=================================================== */
function renderSettings() {
  const d = getData();
  document.getElementById('setHabit').textContent      = d.habitIcon + ' ' + d.habitLabel;
  document.getElementById('setSavingInput').value      = d.dailySaving || 20;
}

function updateSavings() {
  const d = getData();
  d.dailySaving = parseFloat(document.getElementById('setSavingInput').value) || 20;
  saveData(d);
  alert('Daily savings goal updated!');
}

function confirmRelapse() {
  if (!confirm('Reset your streak to 0? Your XP and badges are kept.')) return;
  const d = getData();
  d.streak = 0;
  d.lastCheckin = null;
  saveData(d);
  goHome();
}

function confirmReset() {
  if (!confirm('Delete everything and start over? This cannot be undone.')) return;
  localStorage.clear();
  location.reload();
}

/* ===================================================
   SHARE
=================================================== */
function shareTo(platform) {
  const d   = getData();
  const url = encodeURIComponent(window.location.href);
  const msg = encodeURIComponent(
    `I'm on a ${d.streak}-day streak with no ${d.habitLabel}! 🔥 I've saved $${(d.totalSaved||0).toFixed(0)} so far. Try StayClean → `
  );
  const urls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${msg}`,
    twitter:  `https://twitter.com/intent/tweet?text=${msg}${url}`,
    whatsapp: `https://wa.me/?text=${msg}${url}`,
  };
  window.open(urls[platform], '_blank', 'noopener,noreferrer');
}

/* ===================================================
   SCREEN OVERRIDE — inject render calls
=================================================== */
const _showScreen = showScreen;
window.showScreen = function(id) {
  _showScreen(id);
  if (id === 'screen-badges')  renderBadgesFull();
  if (id === 'screen-settings') renderSettings();
};

/* ===================================================
   INIT
=================================================== */
(function init() {
  const d = getData();
  if (!d.habit) {
    showScreen('screen-onboard');
  } else {
    renderHome();
    showScreen('screen-home');
  }
})();
