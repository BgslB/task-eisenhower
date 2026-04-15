const LANGS = {
  tr: {
    appName: 'GÖREV MATRİSİ', do: 'Hemen Yap', schedule: 'Planla', delegate: 'Delege Et', eliminate: 'Yapma / Sil',
    urgent: 'ACİL & ÖNEMLİ', notUrgent: 'ÖNEMLİ, ACİL DEĞİL', urgentNotImportant: 'ACİL, ÖNEMLİ DEĞİL', neither: 'NE ACİL NE ÖNEMLİ',
    taskPool: 'GÖREV HAVUZU', addTask: '+ Görev Ekle', taskName: 'Görev Adı', date: 'Tarih', category: 'Kategori',
    status: 'Durum', notes: 'Notlar', save: 'Kaydet', cancel: 'İptal', newTask: 'Yeni Görev',
    taskNamePlaceholder: 'Görev adını girin...', notesPlaceholder: 'Notlar...', addNotePlaceholder: 'Not ekle...',
    statuses: { beklemede: '🟡 Beklemede', devam: '🔵 Devam Ediyor', delege: '🟠 Delege Edildi', geri: '🔴 Geri Döndü', tamamlandi: '✅ Tamamlandı' },
    categories: { do: 'DO - Hemen Yap', schedule: 'SCHEDULE - Planla', delegate: 'DELEGATE - Delege Et', eliminate: 'ELIMINATE - Yapma' },
    showArchive: 'Arşivi Göster', hideArchive: 'Arşivi Gizle'
  },
  en: {
    appName: 'TASK MATRIX', do: 'Do Now', schedule: 'Schedule', delegate: 'Delegate', eliminate: 'Eliminate',
    urgent: 'URGENT & IMPORTANT', notUrgent: 'IMPORTANT, NOT URGENT', urgentNotImportant: 'URGENT, NOT IMPORTANT', neither: 'NEITHER URGENT NOR IMPORTANT',
    taskPool: 'TASK POOL', addTask: '+ Add Task', taskName: 'Task Name', date: 'Date', category: 'Category',
    status: 'Status', notes: 'Notes', save: 'Save', cancel: 'Cancel', newTask: 'New Task',
    taskNamePlaceholder: 'Enter task name...', notesPlaceholder: 'Notes...', addNotePlaceholder: 'Add note...',
    statuses: { beklemede: '🟡 Pending', devam: '🔵 In Progress', delege: '🟠 Delegated', geri: '🔴 Returned', tamamlandi: '✅ Completed' },
    categories: { do: 'DO - Do Now', schedule: 'SCHEDULE - Plan', delegate: 'DELEGATE - Delegate', eliminate: 'ELIMINATE - Remove' },
    showArchive: 'Show Archive', hideArchive: 'Hide Archive'
  },
  it: {
    appName: 'MATRICE ATTIVITÀ', do: 'Fai Ora', schedule: 'Pianifica', delegate: 'Delega', eliminate: 'Elimina',
    urgent: 'URGENTE & IMPORTANTE', notUrgent: 'IMPORTANTE, NON URGENTE', urgentNotImportant: 'URGENTE, NON IMPORTANTE', neither: 'NÉ URGENTE NÉ IMPORTANTE',
    taskPool: 'POOL ATTIVITÀ', addTask: '+ Aggiungi', taskName: 'Nome Attività', date: 'Data', category: 'Categoria',
    status: 'Stato', notes: 'Note', save: 'Salva', cancel: 'Annulla', newTask: 'Nuova Attività',
    taskNamePlaceholder: 'Inserisci nome...', notesPlaceholder: 'Note...', addNotePlaceholder: 'Aggiungi nota...',
    statuses: { beklemede: '🟡 In Attesa', devam: '🔵 In Corso', delege: '🟠 Delegato', geri: '🔴 Ritornato', tamamlandi: '✅ Completato' },
    categories: { do: 'DO - Fai Ora', schedule: 'SCHEDULE - Pianifica', delegate: 'DELEGATE - Delega', eliminate: 'ELIMINATE - Elimina' },
    showArchive: 'Mostra Archivio', hideArchive: 'Nascondi Archivio'
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let showArchive = false;
let editingTaskId = null;

const saveTasks = () => localStorage.setItem('tasks', JSON.stringify(tasks));
const getToday = () => new Date().toISOString().split('T')[0];
const formatDate = (d) => { if(!d) return ""; const [y,m,day] = d.split('-'); return `${day}.${m}.${y}`; };
const getLang = () => LANGS[currentLang];

function populateModalDropdowns() {
  const L = getLang();
  document.getElementById('task-category-input').innerHTML = Object.entries(L.categories).map(([val, label]) => `<option value="${val}">${label}</option>`).join('');
  document.getElementById('task-status-input').innerHTML = Object.entries(L.statuses).map(([val, label]) => `<option value="${val}">${label}</option>`).join('');
}

window.setLang = (l) => { currentLang = l; localStorage.setItem('lang', l); renderAll(); };

window.updateStatus = (id, s) => { 
  const t = tasks.find(x => x.id === id); 
  if(t) { 
    t.status = s; 
    if(s === 'devam' || s === 'geri') t.category = 'do';
    if(s === 'delege') t.category = 'delegate';
    saveTasks(); renderAll(); 
  } 
};

window.updateCategory = (id, c) => { const t = tasks.find(x => x.id === id); if(t) { t.category = c; saveTasks(); renderAll(); } };

window.openAddModal = () => {
  editingTaskId = null;
  const L = getLang();
  populateModalDropdowns();
  document.getElementById('modal-title').textContent = L.newTask;
  document.getElementById('task-name-input').value = '';
  document.getElementById('task-name-input').placeholder = L.taskNamePlaceholder;
  document.getElementById('task-notes-input').value = '';
  document.getElementById('task-notes-input').placeholder = L.notesPlaceholder;
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.openEditModal = (id) => {
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  const L = getLang();
  editingTaskId = id;
  populateModalDropdowns();
  document.getElementById('modal-title').textContent = t.name;
  document.getElementById('task-name-input').value = t.name;
  document.getElementById('task-category-input').value = t.category;
  document.getElementById('task-status-input').value = t.status;
  document.getElementById('task-notes-input').value = t.notes || '';
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.closeModal = () => { document.getElementById('modal-overlay').style.display = 'none'; };

window.saveModal = () => {
  const name = document.getElementById('task-name-input').value.trim();
  if(!name) return;
  const category = document.getElementById('task-category-input').value;
  const status = document.getElementById('task-status-input').value;
  const notes = document.getElementById('task-notes-input').value.trim();

  if(editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    if(t) Object.assign(t, { name, category, status, notes });
  } else {
    tasks.push({ id: Math.random().toString(36).substr(2, 9), name, category, status, notes, date: getToday() });
  }
  saveTasks(); closeModal(); renderAll();
};

window.toggleArchive = () => { showArchive = !showArchive; renderAll(); };

function renderAll() {
  const L = getLang();
  const active = tasks.filter(t => t.status !== 'tamamlandi');
  
  document.getElementById('app-name').textContent = L.appName;
  document.getElementById('pool-title').textContent = L.taskPool;
  document.getElementById('btn-add').textContent = L.addTask;
  document.getElementById('th-name').textContent = L.taskName;
  document.getElementById('th-date').textContent = L.date;
  document.getElementById('th-category').textContent = L.category;
  document.getElementById('th-status').textContent = L.status;
  document.getElementById('th-notes').textContent = L.notes;
  document.getElementById('archive-toggle').textContent = showArchive ? L.hideArchive : L.showArchive;
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

  ['tr','en','it'].forEach(l => {
    const btn = document.getElementById(`lang-${l}`);
    if(btn) btn.classList.toggle('active', l === currentLang);
  });

  ['do','schedule','delegate','eliminate'].forEach(q => {
    document.getElementById(`tasks-${q}`).innerHTML = active.filter(t => t.category === q).map(t => `
      <div class="task-chip" onclick="openEditModal('${t.id}')">
        <span>${t.status === 'tamamlandi' ? '✅' : (t.status === 'devam' ? '🔵' : (t.status === 'geri' ? '🔴' : '🟡'))}</span>
        ${t.name}
      </div>
    `).join('');
  });

  const filtered = showArchive ? tasks.filter(t => t.status === 'tamamlandi') : active;
  document.getElementById('task-tbody').innerHTML = filtered.map((t, i) => `
    <tr>
      <td style="color:#ccc">#${i+1}</td>
      <td onclick="openEditModal('${t.id}')" style="cursor:pointer;font-weight:600">${t.name}</td>
      <td>${formatDate(t.date)}</td>
      <td>
        <select class="table-select" onchange="updateCategory('${t.id}', this.value)">
          ${Object.entries(L.categories).map(([val, label]) => `<option value="${val}" ${t.category===val?'selected':''}>${val.toUpperCase()}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="table-select" onchange="updateStatus('${t.id}', this.value)">
          ${Object.entries(L.statuses).map(([k,v]) => `<option value="${k}" ${t.status===k?'selected':''}>${v}</option>`).join('')}
        </select>
      </td>
      <td class="notes-cell" onclick="openEditModal('${t.id}')">${t.notes || L.addNotePlaceholder}</td>
    </tr>
  `).join('');
}

window.onload = () => { renderAll(); };