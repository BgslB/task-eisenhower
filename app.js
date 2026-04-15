const LANGS = {
  tr: {
    appName: 'GÖREV MATRİSİ', do: 'Hemen Yap', schedule: 'Planla', delegate: 'Delege Et', eliminate: 'Yapma / Sil',
    urgent: 'ACİL & ÖNEMLİ', notUrgent: 'ÖNEMLİ, ACİL DEĞİL', urgentNotImportant: 'ACİL, ÖNEMLİ DEĞİL', neither: 'NE ACİL NE ÖNEMLİ',
    taskPool: 'GÖREV HAVUZU', addTask: '+ Görev Ekle', taskName: 'Görev', dateIn: 'Giriş', dateOut: 'Bitiş',
    status: 'Durum/Kime', notes: 'Notlar', save: 'Kaydet', cancel: 'İptal',
    statuses: { beklemede: '🟡 Beklemede', devam: '🔵 Devam Ediyor', delege: '🟠 Delege Edildi', geri: '🔴 Geri Döndü', tamamlandi: '✅ Tamamlandı' },
    categories: { do: 'DO - Hemen Yap', schedule: 'SCHEDULE - Planla', delegate: 'DELEGATE - Delege Et', eliminate: 'ELIMINATE - Yapma' }
  },
  en: {
    appName: 'TASK MATRIX', do: 'Do Now', schedule: 'Schedule', delegate: 'Delegate', eliminate: 'Eliminate',
    urgent: 'URGENT & IMPORTANT', notUrgent: 'IMPORTANT, NOT URGENT', urgentNotImportant: 'URGENT, NOT IMPORTANT', neither: 'NEITHER URGENT NOR IMPORTANT',
    taskPool: 'TASK POOL', addTask: '+ Add Task', taskName: 'Task', dateIn: 'In', dateOut: 'Deadline',
    status: 'Status/To', notes: 'Notes', save: 'Save', cancel: 'Cancel',
    statuses: { beklemede: '🟡 Pending', devam: '🔵 In Progress', delege: '🟠 Delegated', geri: '🔴 Returned', tamamlandi: '✅ Completed' },
    categories: { do: 'DO - Do Now', schedule: 'SCHEDULE - Plan', delegate: 'DELEGATE - Delegate', eliminate: 'ELIMINATE - Remove' }
  },
  it: {
    appName: 'MATRICE ATTIVITÀ', do: 'Fai Ora', schedule: 'Pianifica', delegate: 'Delega', eliminate: 'Elimina',
    urgent: 'URGENTE & IMPORTANTE', notUrgent: 'IMPORTANTE, NON URGENTE', urgentNotImportant: 'URGENTE, NON IMPORTANTE', neither: 'NÉ URGENTE NÉ IMPORTANTE',
    taskPool: 'POOL ATTIVITÀ', addTask: '+ Aggiungi', taskName: 'Attività', dateIn: 'In', dateOut: 'Scadenza',
    status: 'Stato/A', notes: 'Note', save: 'Salva', cancel: 'Annulla',
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
  editingTaskId = null;
  populateModalDropdowns();
  document.getElementById('task-name-input').value = '';
  document.getElementById('task-delegate-input').value = '';
  document.getElementById('task-deadline-input').value = '';
  document.getElementById('task-notes-input').value = '';
  document.getElementById('delegate-to-wrapper').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.openEditModal = (id) => {
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  editingTaskId = id;
  populateModalDropdowns();
  document.getElementById('task-name-input').value = t.name;
  document.getElementById('task-category-input').value = t.category;
  document.getElementById('task-status-input').value = t.status;
  document.getElementById('task-delegate-input').value = t.delegateTo || '';
  document.getElementById('task-deadline-input').value = t.deadline || '';
  document.getElementById('task-notes-input').value = t.notes || '';
  toggleDelegateField();
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.closeModal = () => { document.getElementById('modal-overlay').style.display = 'none'; };

window.saveModal = () => {
  const name = document.getElementById('task-name-input').value.trim();
  if(!name) return;
  const data = {
    name,
    category: document.getElementById('task-category-input').value,
    status: document.getElementById('task-status-input').value,
    delegateTo: document.getElementById('task-delegate-input').value,
    deadline: document.getElementById('task-deadline-input').value,
    notes: document.getElementById('task-notes-input').value
  };

  if(editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    Object.assign(t, data);
  } else {
    tasks.push({ id: Date.now().toString(), ...data, dateCreated: getToday() });
  }
  saveTasks(); closeModal(); renderAll();
};

function renderAll() {
  const L = getLang();
  const active = tasks.filter(t => t.status !== 'tamamlandi');
  
  document.getElementById('app-name').textContent = L.appName;
  document.getElementById('th-name').textContent = L.taskName;
  document.getElementById('th-created').textContent = L.dateIn;
  document.getElementById('th-deadline').textContent = L.dateOut;
  document.getElementById('th-status').textContent = L.status;
  document.getElementById('th-notes').textContent = L.notes;

  ['do','schedule','delegate','eliminate'].forEach(q => {
    document.getElementById(`tasks-${q}`).innerHTML = active.filter(t => t.category === q).map(t => `
      <div class="task-chip" onclick="openEditModal('${t.id}')">
        <div style="font-weight:600">${t.name}</div>
        <div class="chip-meta">
          <span>${formatDate(t.deadline)}</span>
          <span>${t.delegateTo ? '👤 '+t.delegateTo : ''}</span>
        </div>
      </div>
    `).join('');
  });

  const filtered = showArchive ? tasks.filter(t => t.status === 'tamamlandi') : active;
  document.getElementById('task-tbody').innerHTML = filtered.map((t, i) => `
    <tr>
      <td>#${i+1}</td>
      <td onclick="openEditModal('${t.id}')" style="cursor:pointer;font-weight:600">${t.name}</td>
      <td style="font-size:0.7rem;color:#999">${formatDate(t.dateCreated)}</td>
      <td style="color:${t.deadline < getToday() ? 'red' : 'inherit'}">${formatDate(t.deadline)}</td>
      <td>
        <span style="font-size:0.8rem">${L.statuses[t.status]}</span>
        ${t.status === 'delege' && t.delegateTo ? `<span class="delegate-badge">${t.delegateTo}</span>` : ''}
      </td>
      <td class="notes-cell" onclick="openEditModal('${t.id}')">${t.notes || '...'}</td>
    </tr>
  `).join('');
}

window.onload = () => { renderAll(); };