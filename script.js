/* ==============================================
   BrainPulse — script.js
   Tool: Daily Cognitive Brain Score Tracker
   Tests: Reaction Speed · Number Memory · Logic
============================================== */

/* ===== STATE ===== */
const state = {
  screen: 'home',
  currentTest: 0,
  scores: { reaction: 0, memory: 0, logic: 0 },
  testInProgress: false,
};

/* ===== STORAGE HELPERS ===== */
const Store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

function getHistory()   { return Store.get('bp_history')  || []; }
function getBest()      { return Store.get('bp_best')      || 0;  }
function getStreak()    { return Store.get('bp_streak')    || 0;  }
function getTotalTests(){ return Store.get('bp_total')     || 0;  }
function getTodayDate() { return new Date().toISOString().slice(0,10); }
function getTodayScore(){ const h = getHistory(); return h.find(x => x.date === getTodayDate()) || null; }

/* ===== SCREEN ROUTER ===== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  state.screen = id;
}

/* ===== HOME SCREEN ===== */
function goHome() { renderHome(); showScreen('home'); }

function renderHome() {
  document.getElementById('h-streak').textContent = getStreak();
  document.getElementById('h-best').textContent   = getBest() ? getBest() : '—';
  document.getElementById('h-tests').textContent  = getTotalTests();

  const today = getTodayScore();
  const btn   = document.getElementById('startTestBtn');
  const note  = document.getElementById('dailyNote');
  const prev  = document.getElementById('todayPreview');
  const msg   = document.getElementById('todayMsg');

  if (today) {
    msg.textContent = `Today's score: ${today.score}/100 — ${gradeLabel(today.score).grade}`;
    btn.classList.add('disabled');
    btn.innerHTML = '<span class="btn-icon">✓</span><span>Test Complete for Today</span>';
    note.textContent = 'Come back tomorrow for a new challenge!';
    prev.style.borderStyle = 'solid';
  } else {
    msg.textContent = 'Ready to test your mind?';
    btn.classList.remove('disabled');
    btn.innerHTML = '<span class="btn-icon">⚡</span><span>Start Today\'s Test</span>';
    note.textContent = 'Your score resets at midnight';
    prev.style.borderStyle = 'dashed';
  }

  renderHistory();
}

function renderHistory() {
  const list = getHistory().slice(-7).reverse();
  const el   = document.getElementById('historyList');
  if (!list.length) { el.innerHTML = '<p style="font-size:13px;color:var(--muted);text-align:center">No scores yet. Take your first test!</p>'; return; }
  el.innerHTML = list.map(e => `
    <div class="hist-row">
      <span class="hist-date">${e.date.slice(5)}</span>
      <div class="hist-bar-wrap"><div class="hist-bar" style="width:${e.score}%"></div></div>
      <span class="hist-score">${e.score}</span>
    </div>`).join('');
}

/* ===== AD GATE ===== */
function initTest() {
  if (getTodayScore()) return;
  showScreen('adgate');

  let secs = 5;
  const countEl = document.getElementById('gateCount');
  const fillEl  = document.getElementById('gateFill');
  countEl.textContent = secs;
  fillEl.style.width  = '0%';

  // Animate bar
  let pct = 0;
  const barInterval = setInterval(() => {
    pct += 100 / (secs * 20);
    fillEl.style.width = Math.min(pct, 100) + '%';
  }, 50);

  // Countdown
  const tick = setInterval(() => {
    secs--;
    countEl.textContent = secs;
    if (secs <= 0) {
      clearInterval(tick);
      clearInterval(barInterval);
      fillEl.style.width = '100%';
      setTimeout(startTests, 300);
    }
  }, 1000);
}

/* ===== TEST FLOW ===== */
function startTests() {
  state.currentTest = 1;
  state.scores = { reaction: 0, memory: 0, logic: 0 };
  updateProgress(1);
  showScreen('test');
  setTimeout(startTest1, 100);
}

function updateProgress(n) {
  [1,2,3].forEach(i => {
    const dot = document.getElementById('dot' + i);
    dot.className = 'prog-dot' + (i < n ? ' done' : i === n ? ' active' : '');
  });
  document.getElementById('testLabel').textContent = `Test ${n} of 3`;
}

function nextTest() {
  state.currentTest++;
  if (state.currentTest > 3) { finishTests(); return; }
  updateProgress(state.currentTest);
  ['test1','test2','test3'].forEach((id,i) => {
    document.getElementById(id).classList.toggle('hidden', i+1 !== state.currentTest);
  });
  if (state.currentTest === 2) setTimeout(startTest2, 100);
  if (state.currentTest === 3) setTimeout(startTest3, 100);
}

/* ===== TEST 1: REACTION ===== */
let r_ready = false, r_startTime, r_timeout, r_done = false;

function startTest1() {
  document.getElementById('test1').classList.remove('hidden');
  document.getElementById('test2').classList.add('hidden');
  document.getElementById('test3').classList.add('hidden');
  r_done = false; r_ready = false;
  const tgt = document.getElementById('reactionTarget');
  tgt.className = 'reaction-target neutral';
  document.getElementById('reactionMsg').textContent = 'TAP TO BEGIN';
  document.getElementById('reactionHint').textContent = 'Tap the circle to start';
}

function reactionTap() {
  if (r_done) return;
  const tgt = document.getElementById('reactionTarget');
  const hint = document.getElementById('reactionHint');

  if (tgt.className.includes('neutral')) {
    // Start: show waiting state
    tgt.className = 'reaction-target waiting';
    document.getElementById('reactionMsg').textContent = 'WAIT...';
    hint.textContent = 'Wait for amber!';
    const delay = 1500 + Math.random() * 2500;
    r_timeout = setTimeout(() => {
      tgt.className = 'reaction-target go';
      document.getElementById('reactionMsg').textContent = 'TAP!';
      r_startTime = Date.now();
      r_ready = true;
    }, delay);
    return;
  }

  if (tgt.className.includes('waiting')) {
    // Tapped too early
    clearTimeout(r_timeout);
    tgt.className = 'reaction-target neutral';
    document.getElementById('reactionMsg').textContent = 'TOO SOON!';
    hint.textContent = 'Tap to try again';
    state.scores.reaction = 20; // low score penalty
    r_done = true;
    setTimeout(nextTest, 1200);
    return;
  }

  if (r_ready) {
    const ms = Date.now() - r_startTime;
    r_ready = false; r_done = true;
    tgt.className = 'reaction-target done';
    document.getElementById('reactionMsg').textContent = ms + 'ms';
    hint.textContent = ms < 200 ? '⚡ Lightning fast!' : ms < 300 ? '👍 Nice!' : 'Keep practicing!';
    // Score: <150ms=100, 150-200=90, 200-300=75, 300-400=55, 400+=35
    state.scores.reaction = ms < 150 ? 100 : ms < 200 ? 90 : ms < 300 ? 75 : ms < 400 ? 55 : 35;
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(nextTest, 1400);
  }
}

/* ===== TEST 2: MEMORY ===== */
let mem_answer = '', mem_correct = '';

function startTest2() {
  mem_answer = '';
  const digits = 5; // show 5-digit sequence
  mem_correct = Array.from({length: digits}, () => Math.floor(Math.random()*10)).join('');

  const disp = document.getElementById('memDisplay');
  const desc = document.getElementById('memDesc');
  const inp  = document.getElementById('memInput');

  inp.classList.add('hidden');
  disp.textContent = '';
  desc.textContent = 'Memorize this sequence';

  // Show digits one by one
  let i = 0;
  const show = () => {
    if (i < mem_correct.length) {
      disp.textContent = mem_correct.slice(0, i+1).split('').join(' ');
      i++;
      setTimeout(show, 600);
    } else {
      // Hide after viewing time
      setTimeout(() => {
        disp.textContent = '? ? ? ? ?';
        desc.textContent = 'Now enter what you saw';
        buildNumPad();
        document.getElementById('numAnswer').textContent = '';
        mem_answer = '';
        inp.classList.remove('hidden');
      }, 800);
    }
  };
  setTimeout(show, 400);
}

function buildNumPad() {
  const pad = document.getElementById('numPad');
  const keys = [1,2,3,4,5,6,7,8,9,'⌫',0,''];
  pad.innerHTML = keys.map(k => k === ''
    ? `<div></div>`
    : `<div class="num-key${k==='⌫'?' del':''}" onclick="numKey('${k}')">${k}</div>`
  ).join('');
}

function numKey(k) {
  if (k === '⌫') { mem_answer = mem_answer.slice(0,-1); }
  else if (mem_answer.length < mem_correct.length) { mem_answer += k; }
  document.getElementById('numAnswer').textContent = mem_answer.split('').join(' ') || ' ';
  if (navigator.vibrate) navigator.vibrate(15);
}

function submitMemory() {
  let correct = 0;
  for (let i = 0; i < mem_correct.length; i++) {
    if (mem_answer[i] === mem_correct[i]) correct++;
  }
  state.scores.memory = Math.round((correct / mem_correct.length) * 100);
  nextTest();
}

/* ===== TEST 3: LOGIC ===== */
const logicSets = [
  { seq: [2,4,6,8,'?'],   answer: 10, opts: [9,10,11,12]  },
  { seq: [1,3,9,27,'?'],  answer: 81, opts: [54,72,81,90]  },
  { seq: [5,10,15,20,'?'],answer: 25, opts: [22,25,28,30]  },
  { seq: [3,6,12,24,'?'], answer: 48, opts: [36,42,48,56]  },
  { seq: [1,4,9,16,'?'],  answer: 25, opts: [20,23,25,28]  },
  { seq: [100,50,25,'?'], answer: 12.5, opts: [10,12.5,15,20] },
  { seq: [2,3,5,8,'?'],   answer: 13, opts: [11,12,13,14]  },
  { seq: [7,14,21,28,'?'],answer: 35, opts: [33,35,37,42]  },
];
let logic_correct;

function startTest3() {
  const q = logicSets[Math.floor(Math.random() * logicSets.length)];
  logic_correct = q.answer;

  const seqEl  = document.getElementById('logicSeq');
  const optsEl = document.getElementById('logicOpts');

  seqEl.innerHTML = q.seq.map(v =>
    `<div class="logic-item${v==='?'?' blank':''}">${v}</div>`
  ).join('');

  const shuffled = [...q.opts].sort(() => Math.random() - 0.5);
  optsEl.innerHTML = shuffled.map(v =>
    `<div class="logic-opt" onclick="logicPick(this, ${v})">${v}</div>`
  ).join('');
}

function logicPick(el, val) {
  if (state.scores.logic !== 0) return; // already answered

  document.querySelectorAll('.logic-opt').forEach(o => {
    o.style.pointerEvents = 'none';
    if (parseFloat(o.textContent) === logic_correct) o.classList.add('correct');
  });

  const correct = (val === logic_correct);
  el.classList.add(correct ? 'correct' : 'wrong');
  state.scores.logic = correct ? 100 : 0;
  if (navigator.vibrate) navigator.vibrate(correct ? 40 : [30,20,30]);
  setTimeout(nextTest, 900);
}

/* ===== FINISH & SCORE ===== */
function finishTests() {
  const score = Math.round(
    state.scores.reaction * 0.35 +
    state.scores.memory   * 0.35 +
    state.scores.logic    * 0.30
  );

  // Save to history
  const history = getHistory();
  const today   = getTodayDate();
  const existing = history.findIndex(x => x.date === today);
  const entry   = { date: today, score, breakdown: {...state.scores} };
  if (existing > -1) history[existing] = entry; else history.push(entry);
  Store.set('bp_history', history.slice(-30));

  // Update best
  const prev = getBest();
  if (score > prev) Store.set('bp_best', score);

  // Update streak
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yStr = yesterday.toISOString().slice(0,10);
  const hasYest = history.find(x => x.date === yStr);
  Store.set('bp_streak', hasYest ? getStreak() + 1 : 1);

  // Update total
  Store.set('bp_total', getTotalTests() + 1);

  showResult(score, prev);
}

/* ===== RESULT SCREEN ===== */
function showResult(score, prevBest) {
  showScreen('result');

  // Animate score ring (circumference ≈ 327)
  const circ = 327;
  const arc = document.getElementById('scoreArc');
  arc.style.strokeDasharray = '0 ' + circ;
  const target = (score / 100) * circ;
  let cur = 0;
  const step = target / 40;
  const anim = setInterval(() => {
    cur = Math.min(cur + step, target);
    arc.style.strokeDasharray = cur + ' ' + (circ - cur);
    if (cur >= target) clearInterval(anim);
  }, 20);

  // Animate number
  let n = 0;
  const el = document.getElementById('finalScore');
  const numAnim = setInterval(() => {
    n = Math.min(n + Math.ceil(score / 30), score);
    el.textContent = n;
    if (n >= score) clearInterval(numAnim);
  }, 30);

  const gl = gradeLabel(score);
  document.getElementById('resultGrade').textContent = gl.grade;
  document.getElementById('resultMsg').textContent   = gl.msg;

  // Breakdown
  document.getElementById('bk-react').textContent  = state.scores.reaction + '/100';
  document.getElementById('bk-mem').textContent    = state.scores.memory   + '/100';
  document.getElementById('bk-logic').textContent  = state.scores.logic    + '/100';

  // Compare
  const compareEl = document.getElementById('resultCompare');
  if (!prevBest || prevBest === 0) {
    compareEl.textContent = '🎉 First score saved! Come back tomorrow to beat it.';
  } else if (score > prevBest) {
    compareEl.textContent = `🏆 New personal best! +${score - prevBest} pts vs your previous best of ${prevBest}`;
  } else {
    compareEl.textContent = `Try beating your best: ${prevBest}/100 — only ${prevBest - score} pts away!`;
  }
}

function gradeLabel(score) {
  if (score >= 90) return { grade: 'Genius 🧠',      msg: 'Exceptional cognitive performance today!' };
  if (score >= 80) return { grade: 'Sharp Mind ⚡',   msg: 'Your brain is firing on all cylinders.' };
  if (score >= 65) return { grade: 'Above Average 👍', msg: 'Solid performance. Push for a higher score!' };
  if (score >= 50) return { grade: 'Average 🙂',       msg: 'Not bad! A bit more focus could boost your score.' };
  return               { grade: 'Needs Work 💪',       msg: 'Come back tomorrow. Consistency builds sharpness!' };
}

/* ===== SHARE ===== */
function shareTo(platform) {
  const score = Store.get('bp_history')?.slice(-1)[0]?.score ?? '?';
  const url   = encodeURIComponent(window.location.href);
  const text  = encodeURIComponent(`I scored ${score}/100 on BrainPulse daily cognitive test! How sharp is YOUR brain? 🧠⚡`);
  const urls  = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    twitter:  `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
  };
  window.open(urls[platform], '_blank', 'noopener,noreferrer');
}

/* ===== INIT ===== */
renderHome();
showScreen('home');
