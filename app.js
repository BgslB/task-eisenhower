const LANGS = {
  tr: {
    appName: 'GÖREV MATRİSİ', do: 'Hemen Yap', schedule: 'Planla', delegate: 'Delege Et', eliminate: 'Yapma / Sil',
    urgent: 'ACİL & ÖNEMLİ', notUrgent: 'ÖNEMLİ, ACİL DEĞİL', urgentNotImportant: 'ACİL, ÖNEMLİ DEĞİL', neither: 'NE ACİL NE ÖNEMLİ',
    taskPool: 'GÖREV HAVUZU', addTask: '+ Görev Ekle', taskName: 'Görev', dateIn: 'Giriş', dateOut: 'Bitiş',
    status: 'Durum/Kime', notes: 'Notlar', save: 'Kaydet', cancel: 'İptal', deadline: 'Bitiş Tarihi:',
    delPlaceholder: 'Kime delege edildi?', namePlaceholder: 'Görev adı...', notePlaceholder: 'Detaylar...',
    statuses: { beklemede: '🟡 Beklemede', devam: '🔵 Devam Ediyor', delege: '🟠 Delege Edildi', geri: '🔴 Geri Döndü', tamamlandi: '✅ Tamamlandı' },
    categories: { do: 'DO - Hemen Yap', schedule: 'SCHEDULE - Planla', delegate: 'DELEGATE - Delege Et', eliminate: 'ELIMINATE - Yapma' }
  },
  en: {
    appName: 'TASK MATRIX', do: 'Do Now', schedule: 'Schedule', delegate: 'Delegate', eliminate: 'Eliminate',
    urgent: 'URGENT & IMPORTANT', notUrgent: 'IMPORTANT, NOT URGENT', urgentNotImportant: 'URGENT, NOT IMPORTANT', neither: 'NEITHER URGENT NOR IMPORTANT',
    taskPool: 'TASK POOL', addTask: '+ Add Task', taskName: 'Task', dateIn: 'In', dateOut: 'Deadline',
    status: 'Status/To', notes: 'Notes', save: 'Save', cancel: 'Cancel', deadline: 'Deadline:',
    delPlaceholder: 'Delegated to?', namePlaceholder: 'Task name...', notePlaceholder: 'Details...',
    statuses: { beklemede: '🟡 Pending', devam: '🔵 In Progress', delege: '🟠 Delegated', geri: '🔴 Returned', tamamlandi: '✅ Completed' },
    categories: { do: 'DO - Do Now', schedule: 'SCHEDULE - Plan', delegate: 'DELEGATE - Delegate', eliminate: 'ELIMINATE - Remove' }
  },
  it: {
    appName: 'MATRICE ATTIVITÀ', do: 'Fai Ora', schedule: 'Pianifica', delegate: 'Delega', eliminate: 'Elimina',
    urgent: 'URGENTE & IMPORTANTE', notUrgent: 'IMPORTANTE, NON URGENTE', urgentNotImportant: 'URGENTE, NON IMPORTANTE', neither: 'NÉ URGENTE NÉ IMPORTANTE',
    taskPool: 'POOL ATTIVITÀ', addTask: '+ Aggiungi', taskName: 'Attività', dateIn: 'In', dateOut: 'Scadenza',
    status: 'Stato/A', notes: 'Note', save: 'Salva', cancel: 'Annulla', deadline: 'Scadenza:',
    delPlaceholder: 'Delegato a?', namePlaceholder: 'Nome attività...', notePlaceholder: 'Dettagli...',
    statuses: { beklemede: '🟡 In Attesa', devam: '🔵 In Corso', delege: '🟠 Delegato', geri: '🔴 Ritornato', tamamlandi: '✅ Completato' },
    categories: { do: 'DO - Fai Ora', schedule: 'SCHEDULE - Pianifica', delegate: 'DELEGATE - Delega', eliminate: 'ELIMINATE - Elimina' }
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let showArchive = false;
let editingTaskId = null;

const saveTasks = () => localStorage.setItem('tasks', JSON.stringify(tasks));
const getToday = () => new Date().toISOString().split('T')[0];
const formatDate = (d) => { if(!d) return "-"; const [y,m,day] = d.split('-'); return `${day}.${m}.${y}`; };
const getLang = () => LANGS[currentLang];

// Drag & Drop
window.allowDrop = (ev) => ev.preventDefault();
window.drag = (ev, id) => ev.dataTransfer.setData("taskId", id);
window.drop = (ev, newCategory) => {
  ev.preventDefault();
  const id = ev.dataTransfer.getData("taskId");
  const t = tasks.find(x => x.id === id);
  if(t && t.category !== newCategory) {
    if(!t.history) t.history = [];
    const snapshot = { ...t }; delete snapshot.history;
    t.history.push(snapshot);
    if(t.history.length > 3) t.history.shift();
    t.category = newCategory;
    t.updatedAt = new Date().toLocaleString();
    saveTasks(); renderAll();
  }
};

function populateModalDropdowns() {
  const L = getLang();
  document.getElementById('task-category-input').innerHTML = Object.entries(L.categories).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  document.getElementById('task-status-input').innerHTML = Object.entries(L.statuses).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}

window.toggleDelegateField = () => {
  const status = document.getElementById('task-status-input').value;
  document.getElementById('delegate-to-wrapper').style.display = (status === 'delege') ? 'block' : 'none';
};

window.setLang = (l) => { currentLang = l; localStorage.setItem('lang', l); renderAll(); };

window.openAddModal = () => {
  editingTaskId = null; const L = getLang(); populateModalDropdowns();
  document.getElementById('modal-title').textContent = L.addTask;
  document.getElementById('task-name-input').value = '';
  document.getElementById('task-name-input').placeholder = L.namePlaceholder;
  document.getElementById('task-delegate-input').value = '';
  document.getElementById('task-delegate-input').placeholder = L.delPlaceholder;
  document.getElementById('task-deadline-input').value = '';
  document.getElementById('task-notes-input').value = '';
  document.getElementById('task-notes-input').placeholder = L.notePlaceholder;
  document.getElementById('version-info').textContent = "";
  document.getElementById('btn-download').style.display = 'none';
  document.getElementById('delegate-to-wrapper').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.openEditModal = (id) => {
  const t = tasks.find(x => x.id === id); if(!t) return; editingTaskId = id; const L = getLang();
  populateModalDropdowns();
  document.getElementById('modal-title').textContent = t.name;
  document.getElementById('task-name-input').value = t.name;
  document.getElementById('task-category-input').value = t.category;
  document.getElementById('task-status-input').value = t.status;
  document.getElementById('task-delegate-input').value = t.delegateTo || '';
  document.getElementById('task-deadline-input').value = t.deadline || '';
  document.getElementById('task-notes-input').value = t.notes || '';
  document.getElementById('version-info').textContent = t.history ? `v${t.history.length + 1}` : "v1";
  document.getElementById('btn-download').style.display = 'block';
  toggleDelegateField();
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.closeModal = () => document.getElementById('modal-overlay').style.display = 'none';

window.saveModal = () => {
  const name = document.getElementById('task-name-input').value.trim(); if(!name) return;
  const newData = {
    name, category: document.getElementById('task-category-input').value,
    status: document.getElementById('task-status-input').value,
    delegateTo: document.getElementById('task-delegate-input').value,
    deadline: document.getElementById('task-deadline-input').value,
    notes: document.getElementById('task-notes-input').value,
    updatedAt: new Date().toLocaleString()
  };
  if(editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    if(!t.history) t.history = [];
    const snapshot = { ...t }; delete snapshot.history;
    t.history.push(snapshot); if(t.history.length > 3) t.history.shift();
    Object.assign(t, newData);
  } else {
    tasks.push({ id: Date.now().toString(), ...newData, dateCreated: getToday(), history: [] });
  }
  saveTasks(); closeModal(); renderAll();
};

window.downloadHistory = () => {
  const t = tasks.find(x => x.id === editingTaskId); if(!t) return;
  let text = `LOG: ${t.name}\n------------------\nCURRENT: Status: ${t.status}, Notes: ${t.notes}, Updated: ${t.updatedAt}\n\n`;
  if(t.history) t.history.slice().reverse().forEach((h, i) => { text += `v${t.history.length - i}: Status: ${h.status}, Notes: ${h.notes}, Updated: ${h.updatedAt}\n`; });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = `task_${t.id}_history.txt`; a.click();
};

window.toggleArchive = () => { showArchive = !showArchive; renderAll(); };

function renderAll() {
  const L = getLang(); const active = tasks.filter(t => t.status !== 'tamamlandi');
  document.getElementById('app-name').textContent = L.appName;
  document.getElementById('pool-title').textContent = L.taskPool;
  document.getElementById('btn-add').textContent = L.addTask;
  document.getElementById('th-name').textContent = L.taskName;
  document.getElementById('th-created').textContent = L.dateIn;
  document.getElementById('th-deadline').textContent = L.dateOut;
  document.getElementById('th-status').textContent = L.status;
  document.getElementById('th-notes').textContent = L.notes;
  document.getElementById('lbl-deadline').textContent = L.deadline;
  document.getElementById('btn-save').textContent = L.save;
  document.getElementById('btn-cancel').textContent = L.cancel;
  document.getElementById('label-do').textContent = L.do;
  document.getElementById('label-schedule').textContent = L.schedule;
  document.getElementById('label-delegate').textContent = L.delegate;
  document.getElementById('label-eliminate').textContent = L.eliminate;
  document.getElementById('sub-do').textContent = L.urgent;
  document.getElementById('sub-schedule').textContent = L.notUrgent;
  document.getElementById('sub-delegate').textContent = L.urgentNotImportant;
  document.getElementById('sub-eliminate').textContent = L.neither;

  ['tr','en','it'].forEach(l => document.getElementById(`lang-${l}`).classList.toggle('active', l === currentLang));

  ['do','schedule','delegate','eliminate'].forEach(q => {
    document.getElementById(`tasks-${q}`).innerHTML = active.filter(t => t.category === q).map(t => `
      <div class="task-chip" draggable="true" ondragstart="drag(event, '${t.id}')" onclick="openEditModal('${t.id}')">
        <div style="font-weight:600">${t.name}</div>
        <div class="chip-meta"><span>${formatDate(t.deadline)}</span>${t.history?.length > 0 ? `<span style="font-size:0.6rem; color:blue">v${t.history.length+1}</span>` : ''}</div>
      </div>`).join('');
  });

  const filtered = showArchive ? tasks.filter(t => t.status === 'tamamlandi') : active;
  document.getElementById('task-tbody').innerHTML = filtered.map((t, i) => `
    <tr>
      <td>#${i+1}</td>
      <td onclick="openEditModal('${t.id}')" style="cursor:pointer;font-weight:600">${t.name}</td>
      <td>${formatDate(t.dateCreated)}</td>
      <td style="color:${t.deadline && t.deadline < getToday() ? 'red' : 'inherit'}">${formatDate(t.deadline)}</td>
      <td><span>${L.statuses[t.status]}</span>${t.delegateTo ? `<div class="delegate-badge">${t.delegateTo}</div>` : ''}</td>
      <td style="color:#888;font-size:0.75rem">${t.notes || '...'}</td>
    </tr>`).join('');
}
window.onload = () => renderAll();