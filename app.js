const LANGS = {
  tr: {
    appName: 'GÖREV MATRİSİ', do: 'Hemen Yap', schedule: 'Planla', delegate: 'Delege Et', eliminate: 'Yapma / Sil',
    urgent: 'ACİL & ÖNEMLİ', notUrgent: 'ÖNEMLİ, ACİL DEĞİL', urgentNotImportant: 'ACİL, ÖNEMLİ DEĞİL', neither: 'NE ACİL NE ÖNEMLİ',
    taskPool: 'GÖREV HAVUZU', addTask: '+ Görev Ekle', taskName: 'Görev', dateIn: 'Giriş', dateOut: 'Bitiş',
    status: 'Durum/Kime', notes: 'Notlar', save: 'Kaydet', cancel: 'İptal', newTask: 'Yeni Görev', history: 'Geçmiş',
    showArchive: 'Arşivi Göster', hideArchive: 'Arşivi Gizle', noHistory: 'Henüz değişiklik yok',
    statuses: { beklemede: '🟡 Beklemede', devam: '🟢 In Corso', delege: '🟠 Delege Edildi', geri: '🔴 Ritorno', tamamlandi: '⚫ Tamamlandı' },
    categories: { do: 'DO - Hemen Yap', schedule: 'SCHEDULE - Planla', delegate: 'DELEGATE - Delege Et', eliminate: 'ELIMINATE - Yapma' }
  },
  en: {
    appName: 'TASK MATRIX', do: 'Do Now', schedule: 'Schedule', delegate: 'Delegate', eliminate: 'Eliminate',
    urgent: 'URGENT & IMPORTANT', notUrgent: 'IMPORTANT, NOT URGENT', urgentNotImportant: 'URGENT, NOT IMPORTANT', neither: 'NEITHER URGENT NOR IMPORTANT',
    taskPool: 'TASK POOL', addTask: '+ Add Task', taskName: 'Task', dateIn: 'Start', dateOut: 'Deadline',
    status: 'Status/To', notes: 'Notes', save: 'Save', cancel: 'Cancel', newTask: 'New Task', history: 'History',
    showArchive: 'Show Archive', hideArchive: 'Hide Archive', noHistory: 'No changes yet',
    statuses: { beklemede: '🟡 Pending', devam: '🟢 In Progress', delege: '🟠 Delegated', geri: '🔴 Returned', tamamlandi: '⚫ Completed' },
    categories: { do: 'DO - Do Now', schedule: 'SCHEDULE - Plan', delegate: 'DELEGATE - Delegate', eliminate: 'ELIMINATE - Remove' }
  },
  it: {
    appName: 'MATRICE ATTIVITÀ', do: 'Fai Ora', schedule: 'Pianifica', delegate: 'Delega', eliminate: 'Elimina',
    urgent: 'URGENTE & IMPORTANTE', notUrgent: 'IMPORTANTE, NON URGENTE', urgentNotImportant: 'URGENTE, NON IMPORTANTE', neither: 'NÉ URGENTE NÉ IMPORTANTE',
    taskPool: 'POOL ATTIVITÀ', addTask: '+ Aggiungi', taskName: 'Attività', dateIn: 'Inizio', dateOut: 'Scadenza',
    status: 'Stato/A', notes: 'Note', save: 'Salva', cancel: 'Annulla', newTask: 'Nuova Attività', history: 'Cronologia',
    showArchive: 'Mostra Archivio', hideArchive: 'Nascondi Archivio', noHistory: 'Nessuna modifica ancora',
    statuses: { beklemede: '🟡 In Attesa', devam: '🟢 In Corso', delege: '🟠 Delegato', geri: '🔴 Ritornato', tamamlandi: '⚫ Completato' },
    categories: { do: 'DO - Fai Ora', schedule: 'SCHEDULE - Pianifica', delegate: 'DELEGATE - Delega', eliminate: 'ELIMINATE - Elimina' }
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let showArchive = false;
let editingTaskId = null;

const saveTasks = () => localStorage.setItem('tasks', JSON.stringify(tasks));
const getToday = () => new Date().toISOString().split('T')[0];
const getLang = () => LANGS[currentLang];
const formatDate = (d) => { if (!d) return '—'; const [y, m, day] = d.split('-'); return `${day}.${m}.${y}`; };

function addLog(task, note) {
  if (!task.logs) task.logs = [];
  const entry = { date: new Date().toLocaleString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'it' ? 'it-IT' : 'en-GB'), note, version: task.version || 1 };
  if (note.includes('Delege') || note.includes('Delegat') || note.includes('Delegato')) entry.permanent = true;
  const p = task.logs.filter(l => l.permanent), np = task.logs.filter(l => !l.permanent);
  if (!entry.permanent) { np.push(entry); if (np.length > 3) np.shift(); task.logs = [...p, ...np]; }
  else { task.logs = [...p, entry, ...np]; }
}

window.allowDrop = (ev) => ev.preventDefault();
window.drag = (ev, id) => ev.dataTransfer.setData('text', id);
window.drop = (ev, category) => {
  ev.preventDefault();
  const id = ev.dataTransfer.getData('text'), t = tasks.find(x => x.id === id);
  if (!t) return;
  const oldCat = t.category; t.category = category;
  if (category === 'delegate') t.status = 'delege';
  else if (category === 'schedule') t.status = 'beklemede';
  else if (category === 'do' && t.status === 'beklemede') t.status = 'devam';
  t.version = (t.version >= 3) ? 1 : (t.version || 1) + 1;
  addLog(t, `${getLang().categories[oldCat] || oldCat} → ${getLang().categories[category] || category}`);
  saveTasks(); renderAll();
};

window.updateCategoryUI = () => {
  const c = document.getElementById('task-category-input').value, s = document.getElementById('task-status-input');
  if (c === 'delegate') s.value = 'delege'; else if (c === 'schedule') s.value = 'beklemede';
  else if (c === 'do' && s.value === 'beklemede') s.value = 'devam';
  toggleDelegateField();
};

window.updateStatusUI = () => {
  const s = document.getElementById('task-status-input').value, c = document.getElementById('task-category-input');
  if (s === 'devam') c.value = 'do'; else if (s === 'delege') c.value = 'delegate';
  else if (s === 'geri') c.value = 'schedule';
  toggleDelegateField(); toggleDateField();
};

window.toggleDelegateField = () => {
  const s = document.getElementById('task-status-input').value;
  document.getElementById('delegate-to-wrapper').style.display = (s === 'delege') ? 'block' : 'none';
};

window.toggleDateField = () => {
  const c = document.getElementById('task-category-input').value;
  document.getElementById('date-edit-wrapper').style.display = (c === 'schedule') ? 'flex' : 'none';
};

window.openAddModal = () => {
  editingTaskId = null; const L = getLang(); populateModalDropdowns();
  document.getElementById('task-name-input').value = ''; document.getElementById('task-delegate-input').value = '';
  document.getElementById('task-deadline-input').value = ''; document.getElementById('task-notes-input').value = '';
  document.getElementById('modal-history').innerHTML = '';
  syncModalLang(L, L.newTask);
  toggleDelegateField(); toggleDateField();
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.openEditModal = (id) => {
  const t = tasks.find(x => x.id === id); if (!t) return;
  const L = getLang(); editingTaskId = id; populateModalDropdowns();
  document.getElementById('task-name-input').value = t.name;
  document.getElementById('task-category-input').value = t.category;
  document.getElementById('task-status-input').value = t.status;
  document.getElementById('task-delegate-input').value = t.delegateTo || '';
  document.getElementById('task-deadline-input').value = t.deadline || '';
  document.getElementById('task-notes-input').value = t.notes || '';
  syncModalLang(L, t.name + " (v" + t.version + ")");
  renderModalHistory(t); toggleDelegateField(); toggleDateField();
  document.getElementById('modal-overlay').style.display = 'flex';
};

function syncModalLang(L, title) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('btn-modal-cancel').textContent = L.cancel;
  document.getElementById('btn-modal-save').textContent = L.save;
  document.getElementById('lbl-start').textContent = L.dateIn + ":";
  document.getElementById('lbl-deadline').textContent = L.dateOut + ":";
  document.getElementById('task-name-input').placeholder = L.taskName + "...";
  document.getElementById('task-notes-input').placeholder = L.notes + "...";
}

window.closeModal = () => { document.getElementById('modal-overlay').style.display = 'none'; editingTaskId = null; };

function populateModalDropdowns() {
  const L = getLang();
  document.getElementById('task-category-input').innerHTML = Object.entries(L.categories).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  document.getElementById('task-status-input').innerHTML = Object.entries(L.statuses).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}

function renderModalHistory(task) {
  const L = getLang(); const container = document.getElementById('modal-history');
  if (!task.logs || task.logs.length === 0) { container.innerHTML = `<div class="history-empty">${L.noHistory}</div>`; return; }
  container.innerHTML = `<div class="history-title">${L.history}</div>` + task.logs.slice().reverse().map(l => `
    <div class="history-item ${l.permanent ? 'history-permanent' : ''}">
      <span class="history-ver">v${l.version}</span><span>${l.note}</span><span style="margin-left:auto;color:#aaa;font-size:0.6rem">${l.date}</span>
    </div>`).join('');
}

window.saveModal = () => {
  const name = document.getElementById('task-name-input').value.trim(); if (!name) return;
  const L = getLang();
  let fCat = document.getElementById('task-category-input').value, fStat = document.getElementById('task-status-input').value, fDel = document.getElementById('task-delegate-input').value.trim();
  
  if (fStat === 'geri') { fCat = 'do'; fStat = 'devam'; fDel = ''; } // Ritorno Mantığı

  if (editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    if (t) {
      t.version = (t.version >= 3) ? 1 : (t.version || 1) + 1;
      addLog(t, `${L.statuses[t.status]} → ${L.statuses[fStat]}`);
      Object.assign(t, { name, category: fCat, status: fStat, delegateTo: fDel, deadline: document.getElementById('task-deadline-input').value, notes: document.getElementById('task-notes-input').value });
    }
  } else {
    tasks.push({ id: Date.now().toString(), name, category: fCat, status: fStat, delegateTo: fDel, deadline: document.getElementById('task-deadline-input').value, notes: document.getElementById('task-notes-input').value, dateCreated: getToday(), version: 1, logs: [] });
  }
  saveTasks(); closeModal(); renderAll();
};

window.setLang = (l) => { currentLang = l; localStorage.setItem('lang', l); renderAll(); };
window.toggleArchive = () => { showArchive = !showArchive; renderAll(); };
window.downloadTasks = () => { const dl = document.createElement('a'); dl.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2))); dl.setAttribute('download', `tasks_${getToday()}.json`); dl.click(); };

function renderAll() {
  const L = getLang(), today = getToday();
  document.getElementById('app-name').textContent = L.appName;
  document.getElementById('pool-title').textContent = L.taskPool;
  document.getElementById('btn-add').textContent = L.addTask;
  ['do', 'schedule', 'delegate', 'eliminate'].forEach(q => {
    document.getElementById(`label-${q}`).textContent = L[q];
    document.getElementById(`sub-${q}`).textContent = (q==='do'?L.urgent:q==='schedule'?L.notUrgent:q==='delegate'?L.urgentNotImportant:L.neither);
    document.getElementById(`tasks-${q}`).innerHTML = tasks.filter(t => t.status !== 'tamamlandi' && t.category === q).map(t => `
      <div class="task-chip ${t.deadline && t.deadline < today ? 'overdue' : ''}" draggable="true" ondragstart="drag(event,'${t.id}')" onclick="openEditModal('${t.id}')">
        <span class="ver-tag">v${t.version}</span><div class="chip-name">${t.name}</div>
        <div class="chip-meta"><span>${formatDate(t.deadline)}</span><span>${t.delegateTo ? '👤 '+t.delegateTo : ''}</span></div>
      </div>`).join('');
  });
  document.getElementById('th-name').textContent = L.taskName;
  document.getElementById('th-created').textContent = L.dateIn;
  document.getElementById('th-deadline').textContent = L.dateOut;
  document.getElementById('th-status').textContent = L.status;
  document.getElementById('th-notes').textContent = L.notes;
  document.getElementById('archive-toggle').textContent = showArchive ? L.hideArchive : L.showArchive;
  const filtered = showArchive ? tasks.filter(t => t.status === 'tamamlandi') : tasks.filter(t => t.status !== 'tamamlandi');
  document.getElementById('task-tbody').innerHTML = filtered.map(t => `<tr><td style="color:#bbb;font-weight:bold">v${t.version}</td><td onclick="openEditModal('${t.id}')" style="cursor:pointer;font-weight:600">${t.name}</td><td>${formatDate(t.dateCreated)}</td><td style="color:${t.deadline<today&&t.status!=='tamamlandi'?'#ff4d4d':'inherit'}">${formatDate(t.deadline)}</td><td>${L.statuses[t.status]} ${t.delegateTo ? '<br><small>👤 '+t.delegateTo+'</small>' : ''}</td><td>${t.notes ? t.notes.substring(0,20)+'...' : '—'}</td></tr>`).join('');
  ['tr', 'en', 'it'].forEach(l => document.getElementById(`lang-${l}`).classList.toggle('active', l === currentLang));
}

window.onload = renderAll;