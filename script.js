/* === STATE === */
let startTime, timeout, countdownInterval;
let ready = false, inGame = false;
let lastScore = null;
let streak = parseInt(localStorage.getItem('rsg_streak') || '0');
let best    = parseInt(localStorage.getItem('rsg_best')   || '0');

/* === DOM === */
const gameBox       = document.getElementById('gameBox');
const message       = document.getElementById('message');
const countdown     = document.getElementById('countdown');
const resultPanel   = document.getElementById('resultPanel');
const reactionTime  = document.getElementById('reactionTime');
const feedbackMsg   = document.getElementById('feedbackMsg');
const improvMsg     = document.getElementById('improvementMsg');
const startBtn      = document.getElementById('startBtn');
const replayBtn     = document.getElementById('replayBtn');
const shareSection  = document.getElementById('shareSection');
const bestDisplay   = document.getElementById('bestDisplay');
const streakDisplay = document.getElementById('streakDisplay');

/* === FAKE LEADERBOARD === */
const fakeNames = ['Alex','Sam','Kai','Mia','Leo','Nova','Zeke','Aria','Finn','Jade'];
const fakeBase  = [141,148,153,159,165,172,178,185,192,201];

function buildLeaderboard(yourScore) {
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '';
  let entries = fakeNames.map((n, i) => ({ name: n, ms: fakeBase[i] + Math.floor(Math.random() * 8) }));
  if (yourScore) {
    entries.push({ name: 'You', ms: yourScore, isYou: true });
    entries.sort((a, b) => a.ms - b.ms);
  }
  entries.slice(0, 8).forEach((e, i) => {
    const li = document.createElement('li');
    if (e.isYou) li.classList.add('is-you');
    li.innerHTML = '<span class="rank">#'+(i+1)+'</span><span class="name">'+e.name+'</span><span class="time">'+e.ms+'ms</span>';
    list.appendChild(li);
  });
}

/* === AUDIO === */
const ctx = (typeof AudioContext !== 'undefined') ? new AudioContext() :
            (typeof webkitAudioContext !== 'undefined') ? new webkitAudioContext() : null;

function beep(freq, dur, type, vol) {
  if (!ctx) return;
  try {
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type || 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

/* === INIT === */
function init() {
  bestDisplay.textContent   = best ? best + 'ms' : '--';
  streakDisplay.textContent = streak;
  buildLeaderboard(null);
}

/* === START GAME === */
function startGame() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
  clearTimeout(timeout);
  clearInterval(countdownInterval);

  ready = false; inGame = true;
  resultPanel.classList.add('hidden');
  shareSection.classList.add('hidden');
  startBtn.classList.add('hidden');
  replayBtn.classList.add('hidden');
  setBoxState('wait');

  var count = 3;
  countdown.classList.remove('hidden');
  countdown.textContent = count;
  message.textContent = '';
  beep(440, 0.15, 'square', 0.2);

  countdownInterval = setInterval(function() {
    count--;
    if (count > 0) {
      countdown.textContent = count;
      beep(440, 0.15, 'square', 0.2);
    } else {
      clearInterval(countdownInterval);
      countdown.classList.add('hidden');
      beginWait();
    }
  }, 800);
}

function beginWait() {
  message.textContent = 'Wait for green...';
  setBoxState('wait');
  timeout = setTimeout(goGreen, Math.random() * 3000 + 1500);
}

function goGreen() {
  setBoxState('ready');
  message.textContent = 'TAP NOW!';
  beep(880, 0.3, 'sine', 0.4);
  vibrate(50);
  startTime = Date.now();
  ready = true;
}

function setBoxState(state) {
  gameBox.className = state ? 'state-' + state : '';
}

/* === TAP HANDLER === */
function handleTap() {
  if (!inGame) return;

  if (!ready) {
    clearTimeout(timeout);
    clearInterval(countdownInterval);
    countdown.classList.add('hidden');
    inGame = false;
    streak = 0;
    localStorage.setItem('rsg_streak', 0);
    updateStats();
    setBoxState('soon');
    message.textContent = 'Too soon! Tap START to retry.';
    beep(220, 0.4, 'sawtooth', 0.3);
    vibrate([80, 40, 80]);
    showButtons(false);
    return;
  }

  var reaction = Date.now() - startTime;
  lastScore = reaction;
  ready = false; inGame = false;
  beep(660, 0.08, 'sine', 0.35);
  setTimeout(function(){ beep(880, 0.15, 'sine', 0.25); }, 80);
  vibrate(40);

  streak++;
  localStorage.setItem('rsg_streak', streak);
  var newBest = false;
  if (!best || reaction < best) {
    best = reaction;
    localStorage.setItem('rsg_best', best);
    newBest = true;
  }
  updateStats();
  setBoxState('');
  message.textContent = '';
  showResult(reaction, newBest);
  buildLeaderboard(reaction);
  shareSection.classList.remove('hidden');
  showButtons(true);
}

function showResult(ms, newBest) {
  resultPanel.classList.remove('hidden');
  reactionTime.textContent = ms + ' ms';
  var fb, color;
  if (ms < 150)      { fb = 'Lightning Fast!';    color = '#ffd700'; }
  else if (ms < 200) { fb = 'Great Reflex!';      color = '#00ff88'; }
  else if (ms < 300) { fb = 'Average Reaction';   color = '#00e5ff'; }
  else               { fb = 'Keep Practicing!';   color = '#ff4444'; }
  feedbackMsg.textContent = fb;
  feedbackMsg.style.color = color;
  if (newBest && streak === 1) {
    improvMsg.textContent = 'New personal best!';
  } else if (newBest) {
    improvMsg.textContent = 'New best! ' + streak + ' wins in a row!';
  } else if (ms < best + 20) {
    improvMsg.textContent = 'You got faster! Keep going!';
  } else {
    improvMsg.textContent = 'Try beating your best: ' + best + 'ms';
  }
}

function updateStats() {
  bestDisplay.textContent   = best ? best + 'ms' : '--';
  streakDisplay.textContent = streak;
}

function showButtons(hasScore) {
  startBtn.classList.toggle('hidden', hasScore);
  replayBtn.classList.toggle('hidden', !hasScore);
}

/* === SHARE === */
function shareScore(platform) {
  var score = lastScore || 0;
  var text  = encodeURIComponent('I reacted in ' + score + 'ms on Reaction Speed Challenge! Can you beat me? \u26a1');
  var url   = encodeURIComponent(window.location.href);
  var links = {
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url + '&quote=' + text,
    twitter:  'https://twitter.com/intent/tweet?text=' + text + '&url=' + url,
    whatsapp: 'https://api.whatsapp.com/send?text=' + text + '%20' + url
  };
  if (links[platform]) window.open(links[platform], '_blank', 'noopener');
}

init();
