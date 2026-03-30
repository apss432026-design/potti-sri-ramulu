// ===== API CONFIG =====
const API = 'https://potti-sri-ramulu-backend.vercel.app/api';
let db = { potti: {}, trustCards: [], activities: [], gallery: [], contactInfo: {}, members: [], contacts: [] };
let isAdmin = false;
let editCtx = null;

function getToken() { return localStorage.getItem('pst_token'); }
function setToken(t) { localStorage.setItem('pst_token', t); }
function clearToken() { localStorage.removeItem('pst_token'); }
function authHeaders() { const t = getToken(); return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }; }

// ===== DATA LOADING =====
async function loadAllData() {
  try {
    const [potti, trustCards, activities, gallery, contactInfo, members] = await Promise.all([
      fetch(API + '/potti').then(r => r.json()),
      fetch(API + '/trust-cards').then(r => r.json()),
      fetch(API + '/activities').then(r => r.json()),
      fetch(API + '/gallery').then(r => r.json()),
      fetch(API + '/contact-info').then(r => r.json()),
      fetch(API + '/members?public=true').then(r => r.json())
    ]);
    db.potti = potti; db.trustCards = trustCards; db.activities = activities;
    db.gallery = gallery; db.contactInfo = contactInfo; db.members = members;
  } catch (e) { console.error('Load error:', e); }
}

async function loadAdminData() {
  try {
    const [members, contacts, stats] = await Promise.all([
      fetch(API + '/members', { headers: authHeaders() }).then(r => r.json()),
      fetch(API + '/contacts', { headers: authHeaders() }).then(r => r.json()),
      fetch(API + '/stats').then(r => r.json())
    ]);
    db.members = members; db.contacts = contacts; db._stats = stats;
  } catch (e) { console.error('Admin load error:', e); }
}

// ===== RENDER PUBLIC =====
function renderAll() { renderPotti(); renderTrust(); renderActivities(); renderGallery(); renderContactDisp(); renderPublicMembers(); }

function renderPublicMembers() {
  const c = document.getElementById('public-members-container'); if (!c) return;
  const publicMems = (db.members || []).filter(m => m.showPublic === 'Yes' && m.status !== 'Inactive');
  const mains = publicMems.filter(m => m.isMain === 'Yes');
  const others = publicMems.filter(m => m.isMain !== 'Yes');
  let html = '';
  if (mains.length > 0) {
    html += '<div class="main-leaders">';
    html += mains.map(m => `<div class="main-leader-card"><img class="main-leader-photo" src="${esc(m.photo) || 'https://via.placeholder.com/320x320?text=No+Photo'}" onerror="this.src='https://via.placeholder.com/320x320?text=No+Photo'"><div class="main-leader-info"><h4>${esc(m.name)}</h4><div class="main-leader-role">${esc(m.role || 'Founder / Chairman')}</div></div></div>`).join('');
    html += '</div>';
  }
  if (others.length > 0) {
    html += '<div class="other-members" style="margin-bottom:40px;">';
    html += others.map(m => `<div class="other-member-card"><img class="other-member-photo" src="${esc(m.photo) || 'https://via.placeholder.com/200x200?text=No+Photo'}" onerror="this.src='https://via.placeholder.com/200x200?text=No+Photo'"><div class="other-member-info"><h5>${esc(m.name)}</h5><div class="other-member-role">${esc(m.role || 'Member')}</div></div></div>`).join('');
    html += '</div>';
  }
  if (html) { html += '<div class="ornament" style="margin-bottom:50px"><span class="ornament-line"></span><span class="ornament-dot">✦</span><span class="ornament-line right"></span></div>'; }
  c.innerHTML = html;
}

function renderPotti() {
  const p = db.potti;
  setText('potti-name-te', p.nte); setText('potti-name-en', p.nen);
  setText('potti-dates', p.dates); setText('potti-p1-te', p.p1te); setText('potti-p1-en', p.p1en);
  setText('potti-quote-te', p.qte); setText('potti-quote-en', p.qen);
  setText('potti-p2-te', p.p2te); setText('potti-p2-en', p.p2en);
  const img = document.getElementById('potti-img');
  if (p.photo) { img.src = p.photo; img.style.display = 'block'; }
  const chips = (p.chips || '').split(',').map(c => c.trim()).filter(Boolean);
  document.getElementById('potti-chips').innerHTML = chips.map(c => `<span class="chip">${esc(c)}</span>`).join('');
}

function renderTrust() {
  const c = document.getElementById('trust-cards-container');
  if (!db.trustCards || !db.trustCards.length) { c.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-family:Tiro Telugu,serif;grid-column:1/-1">No trust cards added.</p>'; return; }
  c.innerHTML = db.trustCards.map(card => `
    <div class="trust-card" style="padding:0; overflow:hidden;">
      ${isAdmin ? `<div class="card-admin-btns" style="z-index:10;"><button class="card-edit-btn" onclick="openEditTrust('${card._id}')">✏️</button><button class="card-del-btn" onclick="delTrust('${card._id}')">🗑</button></div>` : ''}
      ${card.photo ? `<img src="${esc(card.photo)}" style="width:100%;height:260px;object-fit:cover;display:block;border-bottom:3px solid var(--gold)" alt="photo">` : `<div style="width:100%;height:260px;background:var(--light-bg);display:flex;align-items:center;justify-content:center;color:var(--text-muted);border-bottom:3px solid var(--gold);font-family:'Tiro Telugu',serif;">No Photo</div>`}
      <div style="padding:20px 24px 28px;">
        <h4 class="te">${esc(card.tte)}</h4><h4 class="en">${esc(card.ten)}</h4>
        <p class="te">${esc(card.cte)}</p><p class="en">${esc(card.cen)}</p>
      </div>
    </div>`).join('');
}

function renderActivities() {
  const c = document.getElementById('activities-container');
  if (!db.activities || !db.activities.length) { c.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-family:Tiro Telugu,serif;grid-column:1/-1">No activities added yet.</p>'; return; }
  c.innerHTML = db.activities.map(a => `
    <div class="activity-card" style="padding:0; overflow:hidden; cursor:pointer;" onclick="location.href='activity.html?id=${a._id}'">
      ${isAdmin ? `<div class="card-admin-btns" style="z-index:10;" onclick="event.stopPropagation();"><button class="card-edit-btn" onclick="openEditAct('${a._id}')">✏️</button><button class="card-del-btn" onclick="delActivity('${a._id}')">🗑</button></div>` : ''}
      ${a.photo ? `<img src="${esc(a.photo)}" style="width:100%;height:220px;object-fit:cover;display:block;border-bottom:3px solid var(--saffron)" alt="photo">` : `<div style="width:100%;height:220px;background:var(--light-bg);display:flex;align-items:center;justify-content:center;color:var(--text-muted);border-bottom:3px solid var(--saffron);font-family:'Tiro Telugu',serif;">No Photo</div>`}
      <div class="activity-content">
        <h4 class="te">${esc(a.tte)}</h4><h4 class="en">${esc(a.ten)}</h4>
        <p class="te">${esc(a.dte)}</p><p class="en">${esc(a.den)}</p>
      </div>
    </div>`).join('');
}

function renderGallery() {
  const c = document.getElementById('gallery-container');
  if (!db.gallery || !db.gallery.length) { c.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-family:Tiro Telugu,serif">No gallery items yet.</div>'; return; }
  c.innerHTML = db.gallery.map((g, i) => {
    const photos = g.photos || [];
    let bgLayer = '';
    if (photos.length === 1) bgLayer = `<div style="position:absolute;top:0;left:0;width:100%;height:100%;background-image:url('${esc(photos[0])}');background-size:cover;background-position:center;z-index:0"></div>`;
    else if (photos.length > 1) bgLayer = `<div class="gallery-slider" data-idx="0">${photos.map((p, idx) => `<div class="g-slide ${idx === 0 ? 'active' : ''}" style="background-image:url('${esc(p)}')"></div>`).join('')}</div>`;
    return `
    <div class="gallery-item" style="${i === 0 ? 'grid-column:span 2;aspect-ratio:8/3;' : ''}">
      ${bgLayer}
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(to top, rgba(0,0,0,0.95),transparent 70%);z-index:1;pointer-events:none;"></div>
      <div class="gallery-inner" style="z-index:2;position:relative;">
        ${isAdmin ? `<button class="gallery-del" onclick="delGallery('${g._id}')">🗑 Remove</button>` : ''}
        ${photos.length ? '' : '<span class="gallery-icon">🖼️</span>'}
        <span class="gallery-label te" style="${photos.length ? 'text-shadow:0 2px 4px rgba(0,0,0,0.8);color:white;' : ''}">${esc(g.lte)}</span>
        <span class="gallery-label en" style="${photos.length ? 'text-shadow:0 2px 4px rgba(0,0,0,0.8);color:white;' : ''}">${esc(g.len)}</span>
      </div>
    </div>`;
  }).join('');
}

function renderContactDisp() {
  const ci = db.contactInfo || {};
  const aTe = ci.addrTe || ''; const aEn = ci.addrEn || '';
  const hTe = ci.hrTe || ''; const hEn = ci.hrEn || '';
  setHtml('ci-address-disp', `<span class="te">${esc(aTe).replace(/\n/g, '<br>')}</span><span class="en">${esc(aEn).replace(/\n/g, '<br>')}</span>`);
  setHtml('ci-phone-disp', esc(ci.ph || '').replace(/\n/g, '<br>'));
  setText('ci-email-disp', ci.em || '');
  setHtml('ci-hours-disp', `<span class="te">${esc(hTe).replace(/\|/g, '<br>')}</span><span class="en">${esc(hEn).replace(/\|/g, '<br>')}</span>`);
}

// ===== LANG =====
function setLang(l) { document.body.classList.toggle('english', l === 'en'); document.getElementById('btn-en').classList.toggle('active', l === 'en'); document.getElementById('btn-te').classList.toggle('active', l !== 'en'); }
function toggleNav() { document.getElementById('main-nav').classList.toggle('open'); }
document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => document.getElementById('main-nav').classList.remove('open')));

// ===== CONTACT FORM =====
async function submitContactForm(e) {
  e.preventDefault();
  try {
    await fetch(API + '/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: val('cf-name'), email: val('cf-email'), phone: val('cf-phone'), msg: val('cf-msg') }) });
    document.getElementById('form-success').style.display = 'block';
    e.target.reset();
    setTimeout(() => document.getElementById('form-success').style.display = 'none', 5000);
  } catch (err) { toast('❌ Failed to send message.'); }
}

// ===== ADMIN LOGIN =====
function openAdminLogin() { document.getElementById('admin-overlay').classList.add('active'); document.getElementById('login-error').style.display = 'none'; document.getElementById('admin-user').value = ''; document.getElementById('admin-pass').value = ''; }
function closeAdminLogin() { document.getElementById('admin-overlay').classList.remove('active'); }
document.getElementById('admin-overlay').addEventListener('click', function (e) { if (e.target === this) closeAdminLogin(); });
document.getElementById('admin-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doAdminLogin(); });

async function doAdminLogin() {
  try {
    const res = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: val('admin-user'), password: val('admin-pass') }) });
    const data = await res.json();
    if (res.ok && data.token) {
      setToken(data.token); closeAdminLogin(); isAdmin = true;
      await loadAdminData(); renderAll();
      document.getElementById('admin-dashboard').classList.add('active');
      document.body.style.overflow = 'hidden'; switchTab('dashboard'); refreshDash();
    } else { document.getElementById('login-error').style.display = 'block'; }
  } catch (err) { document.getElementById('login-error').style.display = 'block'; }
}

function adminLogout() { document.getElementById('admin-dashboard').classList.remove('active'); document.body.style.overflow = ''; isAdmin = false; clearToken(); loadAllData().then(renderAll); }

// ===== TABS =====
const TIDS = ['dashboard', 'potti', 'trust', 'act', 'gal', 'contactinfo', 'members', 'addmember', 'messages'];
function switchTab(t) {
  document.querySelectorAll('.admin-tab').forEach((el, i) => el.classList.toggle('active', TIDS[i] === t));
  document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  if (t === 'dashboard') refreshDash();
  if (t === 'members') renderMemTable(db.members);
  if (t === 'messages') renderMessages();
  if (t === 'trust') renderTrustTable();
  if (t === 'act') renderActTable();
  if (t === 'gal') renderGalTable();
  if (t === 'potti') loadPottiForm();
  if (t === 'contactinfo') loadCIForm();
}

// ===== DASHBOARD =====
function refreshDash() {
  const s = db._stats || {};
  setText('s-members', s.members || db.members.length);
  setText('s-msgs', s.contacts || db.contacts.length);
  setText('s-new', s.newMsgs || db.contacts.filter(c => c.status === 'New').length);
  setText('s-trust', s.trustCards || db.trustCards.length);
  setText('s-act', s.activities || db.activities.length);
  setText('s-gal', s.gallery || db.gallery.length);
  const tbody = document.getElementById('dash-msgs');
  if (!db.contacts.length) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📭</div>No messages yet</div></td></tr>'; return; }
  tbody.innerHTML = db.contacts.slice(0, 5).map(c => `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.email)}</td><td>${esc(c.phone || '—')}</td><td style="max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.msg)}</td><td style="white-space:nowrap;font-size:11px">${esc(c.date)}</td><td><span class="badge ${c.status === 'New' ? 'badge-new' : 'badge-read'}">${c.status}</span></td></tr>`).join('');
}

// ===== POTTI =====
function loadPottiForm() {
  const p = db.potti;
  setVal('ap-nte', p.nte); setVal('ap-nen', p.nen); setVal('ap-dates', p.dates);
  setVal('ap-p1te', p.p1te); setVal('ap-p1en', p.p1en); setVal('ap-qte', p.qte); setVal('ap-qen', p.qen);
  setVal('ap-p2te', p.p2te); setVal('ap-p2en', p.p2en); setVal('ap-photo', p.photo || ''); setVal('ap-chips', p.chips || '');
}
async function savePotti() {
  const data = { nte: val('ap-nte'), nen: val('ap-nen'), dates: val('ap-dates'), p1te: val('ap-p1te'), p1en: val('ap-p1en'), qte: val('ap-qte'), qen: val('ap-qen'), p2te: val('ap-p2te'), p2en: val('ap-p2en'), photo: val('ap-photo'), chips: val('ap-chips') };
  const res = await fetch(API + '/potti', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  db.potti = await res.json(); renderPotti(); toast('✅ About Potti saved!');
}

// ===== TRUST =====
async function addTrust() {
  const tte = val('tc-tte'), ten = val('tc-ten'); if (!tte || !ten) { toast('⚠️ Name required!'); return; }
  const body = { photo: val('tc-photo'), tte, ten, cte: val('tc-cte'), cen: val('tc-cen') };
  const res = await fetch(API + '/trust-cards', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (res.ok) { const card = await res.json(); db.trustCards.push(card); renderTrust(); renderTrustTable(); refreshDash(); ['tc-photo', 'tc-tte', 'tc-ten', 'tc-cte', 'tc-cen'].forEach(id => setVal(id, '')); toast('✅ Member added!'); }
}
function renderTrustTable() {
  const tbody = document.getElementById('trust-tbody');
  if (!db.trustCards.length) { tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🏛️</div>No trust cards yet.</div></td></tr>'; return; }
  tbody.innerHTML = db.trustCards.map((c, i) => `<tr><td>${i + 1}</td><td>${c.photo ? `<img src="${esc(c.photo)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">` : '—'}</td><td>${esc(c.tte)}</td><td>${esc(c.ten)}</td><td><button class="action-btn edit" onclick="openEditTrust('${c._id}')">✏️ Edit</button><button class="action-btn delete" onclick="delTrust('${c._id}')">🗑 Del</button></td></tr>`).join('');
}
function openEditTrust(id) {
  const c = db.trustCards.find(x => x._id === id); if (!c) return;
  editCtx = { type: 'trust', id };
  document.getElementById('edit-modal-title').textContent = 'Edit Committee Member';
  document.getElementById('edit-modal-body').innerHTML = `
    <label>Photo Upload</label><input type="file" accept="image/*" onchange="handleImageUpload(this, 'ef-photo')"><input id="ef-photo" type="hidden" value="${esc(c.photo || '')}">
    <label>Member Name (Telugu)</label><input id="ef-tte" value="${esc(c.tte)}">
    <label>Member Name (English)</label><input id="ef-ten" value="${esc(c.ten)}">
    <label>Member Role (Telugu)</label><textarea id="ef-cte">${esc(c.cte)}</textarea>
    <label>Member Role (English)</label><textarea id="ef-cen">${esc(c.cen)}</textarea>`;
  document.getElementById('edit-overlay').classList.add('active');
}
async function delTrust(id) { if (!confirm('Delete?')) return; await fetch(API + '/trust-cards/' + id, { method: 'DELETE', headers: authHeaders() }); db.trustCards = db.trustCards.filter(c => c._id !== id); renderTrust(); renderTrustTable(); refreshDash(); toast('🗑 Deleted.'); }

// ===== ACTIVITIES =====
async function addActivity() {
  const tte = val('ac-tte'), ten = val('ac-ten'); if (!tte || !ten) { toast('⚠️ Title required!'); return; }
  const body = { photo: val('ac-photo'), tte, ten, dte: val('ac-dte'), den: val('ac-den'), ldte: val('ac-ldte'), lden: val('ac-lden') };
  const res = await fetch(API + '/activities', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (res.ok) { const a = await res.json(); db.activities.push(a); renderActivities(); renderActTable(); refreshDash(); ['ac-photo', 'ac-tte', 'ac-ten', 'ac-dte', 'ac-den', 'ac-ldte', 'ac-lden'].forEach(id => setVal(id, '')); toast('✅ Activity added!'); }
}
function renderActTable() {
  const tbody = document.getElementById('act-tbody');
  if (!db.activities.length) { tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🎯</div>No activities yet.</div></td></tr>'; return; }
  tbody.innerHTML = db.activities.map((a, i) => `<tr><td>${i + 1}</td><td>${a.photo ? `<img src="${esc(a.photo)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover">` : '—'}</td><td>${esc(a.tte)}</td><td>${esc(a.ten)}</td><td><button class="action-btn edit" onclick="openEditAct('${a._id}')">✏️ Edit</button><button class="action-btn delete" onclick="delActivity('${a._id}')">🗑 Del</button></td></tr>`).join('');
}
function openEditAct(id) {
  const a = db.activities.find(x => x._id === id); if (!a) return;
  editCtx = { type: 'act', id };
  document.getElementById('edit-modal-title').textContent = 'Edit Activity';
  document.getElementById('edit-modal-body').innerHTML = `
    <label>Photo Upload</label><input type="file" accept="image/*" onchange="handleImageUpload(this, 'ef-photo')"><input id="ef-photo" type="hidden" value="${esc(a.photo || '')}">
    <label>Title (Telugu)</label><input id="ef-tte" value="${esc(a.tte)}">
    <label>Title (English)</label><input id="ef-ten" value="${esc(a.ten)}">
    <label>Description (Telugu)</label><textarea id="ef-cte">${esc(a.dte)}</textarea>
    <label>Description (English)</label><textarea id="ef-cen">${esc(a.den)}</textarea>
    <label>Detailed Description (Telugu)</label><textarea id="ef-ldte" style="height:120px">${esc(a.ldte || '')}</textarea>
    <label>Detailed Description (English)</label><textarea id="ef-lden" style="height:120px">${esc(a.lden || '')}</textarea>`;
  document.getElementById('edit-overlay').classList.add('active');
}
async function delActivity(id) { if (!confirm('Delete?')) return; await fetch(API + '/activities/' + id, { method: 'DELETE', headers: authHeaders() }); db.activities = db.activities.filter(a => a._id !== id); renderActivities(); renderActTable(); refreshDash(); toast('🗑 Deleted.'); }

// ===== GALLERY =====
async function addGallery() {
  const lte = val('gi-lte'), len = val('gi-len'); if (!lte || !len) { toast('⚠️ Labels required!'); return; }
  let photos = []; try { photos = JSON.parse(val('gi-photo')); } catch(e) { if (val('gi-photo')) photos = [val('gi-photo')]; }
  const body = { photos, lte, len };
  const res = await fetch(API + '/gallery', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (res.ok) { const item = await res.json(); db.gallery.push(item); renderGallery(); renderGalTable(); refreshDash(); ['gi-photo', 'gi-lte', 'gi-len'].forEach(id => setVal(id, '')); toast('✅ Gallery item added!'); }
}
function renderGalTable() {
  const tbody = document.getElementById('gal-tbody');
  if (!db.gallery.length) { tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🖼️</div>No gallery items.</div></td></tr>'; return; }
  tbody.innerHTML = db.gallery.map((g, i) => {
    const photos = g.photos || [];
    let t = '—';
    if (photos.length) t = `<img src="${esc(photos[0])}" style="width:60px;height:40px;border-radius:4px;object-fit:cover"><br><small>${photos.length} imgs</small>`;
    return `<tr><td>${i + 1}</td><td>${t}</td><td>${esc(g.lte)}</td><td>${esc(g.len)}</td><td><button class="action-btn edit" onclick="openEditGal('${g._id}')">✏️ Edit</button><button class="action-btn delete" onclick="delGallery('${g._id}')">🗑 Del</button></td></tr>`;
  }).join('');
}
function openEditGal(id) {
  const g = db.gallery.find(x => x._id === id); if (!g) return;
  editCtx = { type: 'gal', id };
  document.getElementById('edit-modal-title').textContent = 'Edit Gallery Item';
  document.getElementById('edit-modal-body').innerHTML = `
    <label>Photos Upload (Multiple)</label><input type="file" accept="image/*" multiple onchange="handleMultipleImageUpload(this, 'ef-photo')"><input id="ef-photo" type="hidden" value="${esc(JSON.stringify(g.photos || [])).replace(/"/g, '&quot;')}">
    <label>Label (Telugu)</label><input id="ef-tte" value="${esc(g.lte)}">
    <label>Label (English)</label><input id="ef-ten" value="${esc(g.len)}">`;
  document.getElementById('edit-overlay').classList.add('active');
}
async function delGallery(id) { if (!confirm('Remove?')) return; await fetch(API + '/gallery/' + id, { method: 'DELETE', headers: authHeaders() }); db.gallery = db.gallery.filter(g => g._id !== id); renderGallery(); renderGalTable(); refreshDash(); toast('🗑 Removed.'); }

// ===== EDIT MODAL =====
function closeEditModal() { document.getElementById('edit-overlay').classList.remove('active'); editCtx = null; }
document.getElementById('edit-overlay').addEventListener('click', function (e) { if (e.target === this) closeEditModal(); });
async function saveEdit() {
  if (!editCtx) return;
  const { type, id } = editCtx;
  let url, body;
  if (type === 'trust') {
    url = API + '/trust-cards/' + id;
    body = { photo: val('ef-photo'), tte: val('ef-tte'), ten: val('ef-ten'), cte: val('ef-cte'), cen: val('ef-cen') };
  } else if (type === 'act') {
    url = API + '/activities/' + id;
    body = { photo: val('ef-photo'), tte: val('ef-tte'), ten: val('ef-ten'), dte: val('ef-cte'), den: val('ef-cen'), ldte: val('ef-ldte'), lden: val('ef-lden') };
  } else if (type === 'gal') {
    url = API + '/gallery/' + id;
    let photos = []; try { photos = JSON.parse(val('ef-photo')); } catch(e) { if (val('ef-photo')) photos = [val('ef-photo')]; }
    body = { photos, lte: val('ef-tte'), len: val('ef-ten') };
  }
  const res = await fetch(url, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  if (res.ok) {
    const updated = await res.json();
    if (type === 'trust') { const idx = db.trustCards.findIndex(x => x._id === id); if (idx >= 0) db.trustCards[idx] = updated; renderTrust(); renderTrustTable(); }
    else if (type === 'act') { const idx = db.activities.findIndex(x => x._id === id); if (idx >= 0) db.activities[idx] = updated; renderActivities(); renderActTable(); }
    else if (type === 'gal') { const idx = db.gallery.findIndex(x => x._id === id); if (idx >= 0) db.gallery[idx] = updated; renderGallery(); renderGalTable(); }
  }
  closeEditModal(); toast('✅ Saved!');
}

// ===== CONTACT INFO =====
function loadCIForm() { const ci = db.contactInfo || {}; setVal('ci-addr-te', ci.addrTe || ''); setVal('ci-addr-en', ci.addrEn || ''); setVal('ci-ph', ci.ph || ''); setVal('ci-em', ci.em || ''); setVal('ci-hr-te', ci.hrTe || ''); setVal('ci-hr-en', ci.hrEn || ''); }
async function saveContactInfo() {
  const body = { addrTe: val('ci-addr-te'), addrEn: val('ci-addr-en'), ph: val('ci-ph'), em: val('ci-em'), hrTe: val('ci-hr-te'), hrEn: val('ci-hr-en') };
  const res = await fetch(API + '/contact-info', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  db.contactInfo = await res.json(); renderContactDisp(); toast('✅ Contact info saved!');
}

// ===== MEMBERS =====
async function addMember() {
  const name = val('m-name'), mobile = val('m-mobile'); if (!name || !mobile) { toast('⚠️ Name and Mobile required!'); return; }
  const body = { name, mobile, role: val('m-role'), photo: val('m-photo'), isMain: val('m-ismain'), showPublic: val('m-showpublic'), father: val('m-father'), email: val('m-email'), village: val('m-village'), mandal: val('m-mandal'), district: val('m-district'), age: val('m-age') || null, occ: val('m-occ'), type: val('m-type'), status: val('m-status'), notes: val('m-notes'), joined: new Date().toLocaleDateString('en-IN') };
  const res = await fetch(API + '/members', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (res.ok) { const m = await res.json(); db.members.push(m); ['m-name', 'm-role', 'm-photo', 'm-father', 'm-mobile', 'm-email', 'm-village', 'm-mandal', 'm-district', 'm-age', 'm-occ', 'm-notes'].forEach(id => setVal(id, '')); setVal('m-ismain', 'No'); setVal('m-showpublic', 'Yes'); toast('✅ Member added!'); refreshDash(); renderPublicMembers(); }
}
function renderMemTable(list) {
  const tbody = document.getElementById('mem-tbody');
  if (!list || !list.length) { tbody.innerHTML = '<tr><td colspan="11"><div class="empty-state"><div class="empty-icon">👥</div>No members yet.</div></td></tr>'; return; }
  tbody.innerHTML = list.map((m, i) => `<tr><td>${i + 1}</td><td><b>${esc(m.name)}</b><br><small style="color:var(--text-muted)">${esc(m.father || '')}</small></td><td>${esc(m.mobile)}</td><td>${esc(m.email || '—')}</td><td>${esc(m.village || '—')}</td><td>${esc(m.mandal || '—')}</td><td>${esc(m.district || '—')}</td><td>${esc(m.type || 'General')}</td><td style="white-space:nowrap;font-size:11px">${esc(m.joined)}</td><td><span class="badge ${m.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${m.status}</span></td><td><button class="action-btn delete" onclick="delMember('${m._id}')">🗑</button></td></tr>`).join('');
}
function filterMembers(q) { renderMemTable(db.members.filter(m => m.name.toLowerCase().includes(q.toLowerCase()) || m.mobile.includes(q) || (m.village || '').toLowerCase().includes(q.toLowerCase()) || (m.district || '').toLowerCase().includes(q.toLowerCase()))); }
async function delMember(id) { if (!confirm('Delete member?')) return; await fetch(API + '/members/' + id, { method: 'DELETE', headers: authHeaders() }); db.members = db.members.filter(m => m._id !== id); renderMemTable(db.members); refreshDash(); renderPublicMembers(); toast('🗑 Member deleted.'); }

// ===== MESSAGES =====
function renderMessages() {
  const tbody = document.getElementById('msg-tbody');
  const nc = db.contacts.filter(c => c.status === 'New').length;
  setText('msg-count', `${db.contacts.length} total | ${nc} new`);
  if (!db.contacts.length) { tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div>No messages yet.</div></td></tr>'; return; }
  tbody.innerHTML = db.contacts.map((c, i) => `<tr><td>${i + 1}</td><td><b>${esc(c.name)}</b></td><td>${esc(c.email)}</td><td>${esc(c.phone || '—')}</td><td style="max-width:180px">${esc(c.msg)}</td><td style="white-space:nowrap;font-size:11px">${esc(c.date)}</td><td><span class="badge ${c.status === 'New' ? 'badge-new' : 'badge-read'}">${c.status}</span></td><td>${c.status === 'New' ? `<button class="action-btn mark-read" onclick="markRead('${c._id}')">✓</button>` : ''}<button class="action-btn delete" onclick="delMsg('${c._id}')">🗑</button></td></tr>`).join('');
}
async function markRead(id) { await fetch(API + '/contacts/' + id + '/read', { method: 'PUT', headers: authHeaders() }); const c = db.contacts.find(x => x._id === id); if (c) c.status = 'Read'; renderMessages(); refreshDash(); }
async function delMsg(id) { if (!confirm('Delete?')) return; await fetch(API + '/contacts/' + id, { method: 'DELETE', headers: authHeaders() }); db.contacts = db.contacts.filter(c => c._id !== id); renderMessages(); refreshDash(); toast('🗑 Deleted.'); }

// ===== IMAGE UPLOAD UTILS =====
function handleMultipleImageUpload(input, targetId) {
  const files = input.files; if (!files.length) return;
  const results = []; let processed = 0;
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas'); const MAX_WIDTH = 400;
        let width = img.width, height = img.height;
        if (width > MAX_WIDTH) { height = Math.round(height * MAX_WIDTH / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
        results.push(canvas.toDataURL('image/jpeg', 0.7)); processed++;
        if (processed === files.length) { document.getElementById(targetId).value = JSON.stringify(results); toast(`✅ ${files.length} images processed & ready!`); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(files[i]);
  }
}
function handleImageUpload(input, targetId) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas'); const MAX_WIDTH = 600;
      let width = img.width, height = img.height;
      if (width > MAX_WIDTH) { height = Math.round(height * MAX_WIDTH / width); width = MAX_WIDTH; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
      document.getElementById(targetId).value = canvas.toDataURL('image/jpeg', 0.82);
      toast('✅ Image processed & ready!');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== UTILS =====
function val(id) { const el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }
function setHtml(id, h) { const el = document.getElementById(id); if (el) el.innerHTML = h; }
function esc(s) { return s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }

// ===== ACTIVITY POPUP =====
function showLatestActivityPopup() {
  if (sessionStorage.getItem('activity_popup_shown')) return;
  if (!db.activities || db.activities.length === 0) return;

  const latest = db.activities[db.activities.length - 1];
  const popup = document.getElementById('activity-popup');
  
  document.getElementById('popup-img').src = latest.photo || 'assets/logo.jpg';
  setText('popup-title-te', latest.tte);
  setText('popup-title-en', latest.ten);
  setText('popup-desc-te', latest.dte);
  setText('popup-desc-en', latest.den);
  
  const viewLink = `activity.html?id=${latest._id}`;
  document.getElementById('popup-view-more').href = viewLink;
  document.getElementById('popup-view-more-en').href = viewLink;

  setTimeout(() => {
    popup.classList.add('active');
    sessionStorage.setItem('activity_popup_shown', 'true');
  }, 1000);
}

function closeActivityPopup() {
  const popup = document.getElementById('activity-popup');
  popup.style.opacity = '0';
  setTimeout(() => {
    popup.classList.remove('active');
    popup.style.opacity = '';
  }, 5000);
}

// ===== INIT =====
loadAllData().then(() => {
  renderAll();
  showLatestActivityPopup();
  setTimeout(() => {
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } }); }, { threshold: .1 });
    document.querySelectorAll('.trust-card,.activity-card,.gallery-item').forEach((el, i) => {
      el.style.opacity = '0'; el.style.transform = 'translateY(22px)';
      el.style.transition = `opacity .5s ease ${i * .06}s,transform .5s ease ${i * .06}s`;
      obs.observe(el);
    });
    setInterval(() => {
      document.querySelectorAll('.gallery-slider').forEach(slider => {
        const slides = slider.querySelectorAll('.g-slide');
        if (slides.length > 1) {
          let idx = parseInt(slider.getAttribute('data-idx') || '0');
          slides[idx].classList.remove('active');
          idx = (idx + 1) % slides.length;
          slides[idx].classList.add('active');
          slider.setAttribute('data-idx', idx);
        }
      });
    }, 3500);
  }, 150);
});
