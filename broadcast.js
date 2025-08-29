
// broadcast.js — Night Broadcast for Win95 skin (no dependencies)
(function(){
  const feed = document.getElementById('feed');
  const send = document.getElementById('send');
  const input = document.getElementById('msg');
  const maskSel = document.getElementById('mask');
  const left = document.getElementById('left');
  const sessionLabel = document.getElementById('sessionLabel');
  const LS = 'broadcast95_sessions';

  function todayKey(){
    const d = new Date();
    const y = d.getFullYear(), m = d.getMonth()+1, day = d.getDate();
    return y+'-'+String(m).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  }
  function sessionId(){
    const k = todayKey();
    if (sessionLabel) sessionLabel.textContent = k;
    return k;
  }
  function resetTime(){
    const n = new Date();
    const r = new Date(n);
    r.setHours(6,0,0,0);
    if (n >= r) r.setDate(r.getDate()+1);
    return r.getTime();
  }
  function msLeft(){ return Math.max(0, resetTime() - Date.now()); }
  function fmt(ms){
    const s = Math.floor(ms/1000), h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
  }
  function load(){
    try{
      const raw = localStorage.getItem(LS);
      const obj = raw ? JSON.parse(raw) : {};
      return obj[sessionId()] || [];
    }catch(e){ return []; }
  }
  function save(list){
    try{
      const raw = localStorage.getItem(LS);
      const all = raw ? JSON.parse(raw) : {};
      all[sessionId()] = list;
      localStorage.setItem(LS, JSON.stringify(all));
    }catch(e){}
  }
  /**
   * Escape HTML special characters in a string.
   * Converts &, <, >, " and ' into their corresponding HTML entities to prevent
   * injection issues when inserting user‑supplied text into the DOM.
   *
   * @param {string} s The input string to escape.
   * @returns {string} The escaped string.
   */
  function esc(s) {
    // Coerce non‑string values to a string to avoid runtime errors.
    return String(s).replace(/[&<>"']/g, (ch) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return map[ch] || ch;
    });
  }

  function addMessage(mask, text){
    const list = load();
    list.push({ id: 'm'+Math.random().toString(36).slice(2,9), t: Date.now(), mask, text });
    save(list);
    render();
  }

  function render(){
    // Render messages to the feed element, pruning expired entries along the way.
    // We guard against a missing feed (e.g. if this script is used on a page
    // without a feed element) and aggressively prune messages older than 30
    // minutes to prevent unbounded growth of localStorage.  Messages older than
    // 10 minutes are visually dimmed.
    const hasFeed = Boolean(feed);
    const all = load().slice().sort((a, b) => a.t - b.t);
    const pruned = [];
    const nowMs = Date.now();
    if (hasFeed) feed.innerHTML = '';
    for (const m of all) {
      const age = nowMs - m.t;
      if (age > 30 * 60 * 1000) continue; // drop messages >30m
      pruned.push(m);
      if (!hasFeed) continue;
      const dim = age > 10 * 60 * 1000 ? ' dim' : '';
      const row = document.createElement('div');
      row.className = 'row95' + dim;
      const time = new Date(m.t).toTimeString().slice(0, 5);
      row.innerHTML =
        '<div><span class="badge95">' + esc(m.mask) + '</span></div>' +
        '<div>' + esc(m.text) + '</div>' +
        '<div><span class="badge95">' + time + '</span></div>';
      feed.appendChild(row);
    }
    save(pruned);
    if (hasFeed) feed.scrollTop = feed.scrollHeight;
  }

  if (send) {
    // When the user clicks Send, trim and validate the message.  Use optional
    // chaining to handle scenarios where the input or mask selector are
    // missing on the page.  Default the mask to an empty string when no
    // selector is present.
    send.addEventListener('click', () => {
      const v = (input?.value || '').trim();
      if (!v) return;
      const maskVal = maskSel ? maskSel.value : '';
      addMessage(maskVal, v);
      if (input) input.value = '';
    });
  }
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send?.click();
      }
    });
  }
  const resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', ()=>{
      const raw = localStorage.getItem(LS);
      const all = raw ? JSON.parse(raw) : {};
      all[sessionId()] = [];
      localStorage.setItem(LS, JSON.stringify(all));
      render();
    });
  }

  setInterval(()=>{ if(left) left.textContent = fmt(msLeft()); render(); }, 1000);

  // seed demo
  if (load().length === 0){
    const t = Date.now();
    save([
      { id:'s1', t: t-9*60*1000, mask:'Ночной наблюдатель', text:'Город шумит, а мне слышится море.' },
      { id:'s2', t: t-3*60*1000, mask:'Тень', text:'Иногда тишина говорит громче' },
      { id:'s3', t: t-40*1000, mask:'Грустный киборг', text:'Сбой — это тоже стиль.' }
    ]);
  }
  if (left) left.textContent = fmt(msLeft());
  render();
})();
