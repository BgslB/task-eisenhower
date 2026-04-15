// ============ DİL SİSTEMİ ============
const LANGS = {
  tr: {
    appName: 'GÖREV MATRİSİ',
    do: 'Hemen Yap', schedule: 'Planla', delegate: 'Delege Et', eliminate: 'Yapma / Sil',
    urgent: 'ACİL & ÖNEMLİ', notUrgent: 'ÖNEMLİ, ACİL DEĞİL',
    urgentNotImportant: 'ACİL, ÖNEMLİ DEĞİL', neither: 'NE ACİL NE ÖNEMLİ',
    taskPool: 'GÖREV HAVUZU', addTask: '+ Görev Ekle',
    taskName: 'Görev', dateIn: 'Giriş', dateOut: 'Bitiş',
    status: 'Durum/Kime', notes: 'Notlar', save: 'Kaydet', cancel: 'İptal',
    newTask: 'Yeni Görev', history: 'Geçmiş',
    showArchive: 'Arşivi Göster', hideArchive: 'Arşivi Gizle',
    noHistory: 'Henüz değişiklik yok',
    statuses: {
      beklemede: '🟡 Beklemede',
      devam: '🟢 In Corso',
      delege: '🟠 Delege Edildi',
      geri: '🔴 Geri Döndü',
      tamamlandi: '⚫ Tamamlandı'
    },
    categories: {
      do: 'DO - Hemen Yap',
      schedule: 'SCHEDULE - Planla',
      delegate: 'DELEGATE - Delege Et',
      eliminate: 'ELIMINATE - Yapma'
    }
  },
  en: {
    appName: 'TASK MATRIX',
    do: 'Do Now', schedule: 'Schedule', delegate: 'Delegate', eliminate: 'Eliminate',
    urgent: 'URGENT & IMPORTANT', notUrgent: 'IMPORTANT, NOT URGENT',
    urgentNotImportant: 'URGENT, NOT IMPORTANT', neither: 'NEITHER URGENT NOR IMPORTANT',
    taskPool: 'TASK POOL', addTask: '+ Add Task',
    taskName: 'Task', dateIn: 'Start', dateOut: 'Deadline',
    status: 'Status/To', notes: 'Notes', save: 'Save', cancel: 'Cancel',
    newTask: 'New Task', history: 'History',
    showArchive: 'Show Archive', hideArchive: 'Hide Archive',
    noHistory: 'No changes yet',
    statuses: {
      beklemede: '🟡 Pending',
      devam: '🟢 In Progress',
      delege: '🟠 Delegated',
      geri: '🔴 Returned',
      tamamlandi: '⚫ Completed'
    },
    categories: {
      do: 'DO - Do Now',
      schedule: 'SCHEDULE - Plan',
      delegate: 'DELEGATE - Delegate',
      eliminate: 'ELIMINATE - Remove'
    }
  },
  it: {
    appName: 'MATRICE ATTIVITÀ',
    do: 'Fai Ora', schedule: 'Pianifica', delegate: 'Delega', eliminate: 'Elimina',
    urgent: 'URGENTE & IMPORTANTE', notUrgent: 'IMPORTANTE, NON URGENTE',
    urgentNotImportant: 'URGENTE, NON IMPORTANTE', neither: 'NÉ URGENTE NÉ IMPORTANTE',
    taskPool: 'POOL ATTIVITÀ', addTask: '+ Aggiungi',
    taskName: 'Attività', dateIn: 'Inizio', dateOut: 'Scadenza',
    status: 'Stato/A', notes: 'Note', save: 'Salva', cancel: 'Annulla',
    newTask: 'Nuova Attività', history: 'Cronologia',
    showArchive: 'Mostra Archivio', hideArchive: 'Nascondi Archivio',
    noHistory: 'Nessuna modifica ancora',
    statuses: {
      beklemede: '🟡 In Attesa',
      devam: '🟢 In Corso',
      delege: '🟠 Delegato',
      geri: '🔴 Ritornato',
      tamamlandi: '⚫ Completato'
    },
    categories: {
      do: 'DO - Fai Ora',
      schedule: 'SCHEDULE - Pianifica',
      delegate: 'DELEGATE - Delega',
      eliminate: 'ELIMINATE - Elimina'
    }
  }
};

// ============ DURUM → KATEGORİ ============
const STATUS_TO_CATEGORY = {
  devam: 'do',
  delege: 'delegate',
  geri: 'schedule',
  beklemede: null,
  tamamlandi: null
};

const STATUS_AFTER_GERI = 'beklemede';

// ============ CHIP RENKLERİ ============
const STATUS_CHIP_STYLE = {
  beklemede: { border: '2px solid #f5c842', background: 'rgba(245,200,66,0.08)' },
  devam:     { border: '2px solid #4caf50', background: 'rgba(76,175,80,0.08)' },
  delege:    { border: '2px solid #ff9800', background: 'rgba(255,152,0,0.08)' },
  geri:      { border: '2px solid #f44336', background: 'rgba(244,67,54,0.08)' },
  tamamlandi:{ border: '2px solid #888',    background: 'rgba(136,136,136,0.08)' }
};

// ============ STATE ============
let currentLang = localStorage.getItem('lang') || 'tr';
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let showArchive = false;
let editingTaskId = null;

// ============ YARDIMCI ============
const saveTasks = () => localStorage.setItem('tasks', JSON.stringify(tasks));
const getToday = () => new Date().toISOString().split('T')[0];
const getLang = () => LANGS[currentLang];
const formatDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

// ============ GÜNLÜK AKTARIM ============
function checkDailyTransfer() {
  const today = getToday();
  const lastOpen = localStorage.getItem('lastOpen');
  if (lastOpen && lastOpen !== today) {
    tasks = tasks.map(t => {
      if (t.status !== 'tamamlandi') {
        return { ...t, dateCreated: today, transferredFrom: t.dateCreated };
      }
      return t;
    });
    saveTasks();
  }
  localStorage.setItem('lastOpen', today);
}

// ============ LOG SİSTEMİ ============
function addLog(task, note) {
  if (!task.logs) task.logs = [];
  const entry = {
    date: new Date().toLocaleString(currentLang === 'tr' ? 'tr-TR' : currentLang === 'it' ? 'it-IT' : 'en-GB'),
    note,
    version: task.version || 1
  };

  // Delege logu kalıcı
  if (note.includes('Delege') || note.includes('Delegat') || note.includes('Delegato')) {
    entry.permanent = true;
  }

  const permanent = task.logs.filter(l => l.permanent);
  const nonPermanent = task.logs.filter(l => !l.permanent);

  if (!entry.permanent) {
    nonPermanent.push(entry);
    if (nonPermanent.length > 3) nonPermanent.shift();
    task.logs = [...permanent, ...nonPermanent];
  } else {
    task.logs = [...permanent, entry, ...nonPermanent];
  }
}

// ============ DRAG & DROP ============
window.allowDrop = (ev) => ev.preventDefault();
window.drag = (ev, id) => ev.dataTransfer.setData('text', id);
window.drop = (ev, category) => {
  ev.preventDefault();
  const id = ev.dataTransfer.getData('text');
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const oldCat = t.category;
  t.category = category;
  if (category === 'delegate') t.status = 'delege';
  else if (category === 'schedule') t.status = 'beklemede';
  else if (category === 'do' && t.status === 'beklemede') t.status = 'devam';
  t.version = (t.version || 1) + 1;
  const L = getLang();
  addLog(t, `${L.categories[oldCat] || oldCat} → ${L.categories[category] || category}`);
  saveTasks();
  renderAll();
};

// ============ MODAL UI SYNC ============
window.updateCategoryUI = () => {
  const cat = document.getElementById('task-category-input').value;
  const statEl = document.getElementById('task-status-input');
  if (cat === 'delegate') statEl.value = 'delege';
  else if (cat === 'schedule') statEl.value = 'beklemede';
  else if (cat === 'do' && statEl.value === 'beklemede') statEl.value = 'devam';
  toggleDelegateField();
};

window.updateStatusUI = () => {
  const stat = document.getElementById('task-status-input').value;
  const catEl = document.getElementById('task-category-input');
  if (stat === 'devam') catEl.value = 'do';
  else if (stat === 'delege') catEl.value = 'delegate';
  else if (stat === 'geri') catEl.value = 'schedule';
  toggleDelegateField();
  toggleDateField();
};

window.toggleDelegateField = () => {
  const status = document.getElementById('task-status-input').value;
  const wrapper = document.getElementById('delegate-to-wrapper');
  if (wrapper) wrapper.style.display = (status === 'delege') ? 'block' : 'none';
};

window.toggleDateField = () => {
  const cat = document.getElementById('task-category-input').value;
  const wrapper = document.getElementById('date-edit-wrapper');
  if (wrapper) wrapper.style.display = (cat === 'schedule') ? 'flex' : 'none';
};

// ============ MODAL AÇ/KAPA ============
window.openAddModal = () => {
  editingTaskId = null;
  populateModalDropdowns();
  document.getElementById('task-name-input').value = '';
  document.getElementById('task-delegate-input').value = '';
  document.getElementById('task-deadline-input').value = '';
  document.getElementById('task-start-input').value = getToday();
  document.getElementById('task-notes-input').value = '';
  document.getElementById('modal-history').innerHTML = '';
  document.getElementById('modal-title').textContent = getLang().newTask;
  toggleDelegateField();
  toggleDateField();
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.openEditModal = (id) => {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  editingTaskId = id;
  populateModalDropdowns();
  document.getElementById('task-name-input').value = t.name;
  document.getElementById('task-category-input').value = t.category;
  document.getElementById('task-status-input').value = t.status;
  document.getElementById('task-delegate-input').value = t.delegateTo || '';
  document.getElementById('task-deadline-input').value = t.deadline || '';
  document.getElementById('task-start-input').value = t.dateCreated || getToday();
  document.getElementById('task-notes-input').value = t.notes || '';
  renderModalHistory(t);
  toggleDelegateField();
  toggleDateField();
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.closeModal = () => {
  document.getElementById('modal-overlay').style.display = 'none';
  editingTaskId = null;
};

function populateModalDropdowns() {
  const L = getLang();
  document.getElementById('task-category-input').innerHTML =
    Object.entries(L.categories).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  document.getElementById('task-status-input').innerHTML =
    Object.entries(L.statuses).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}

function renderModalHistory(task) {
  const L = getLang();
  const container = document.getElementById('modal-history');
  if (!task.logs || task.logs.length === 0) {
    container.innerHTML = `<div class="history-empty">${L.noHistory}</div>`;
    return;
  }
  container.innerHTML = `
    <div class="history-title">${L.history}</div>
    ${task.logs.slice().reverse().map(l => `
      <div class="history-item ${l.permanent ? 'history-permanent' : ''}">
        <span class="history-ver">v${l.version}</span>
        <span class="history-note">${l.note}</span>
        <span class="history-date">${l.date}</span>
      </div>
    `).join('')}
  `;
}

// ============ KAYDET ============
window.saveModal = () => {
  const name = document.getElementById('task-name-input').value.trim();
  if (!name) return;
  const L = getLang();

  let finalCat = document.getElementById('task-category-input').value;
  let finalStatus = document.getElementById('task-status-input').value;
  let finalDelegateTo = document.getElementById('task-delegate-input').value.trim();
  const deadline = document.getElementById('task-deadline-input').value;
  const startDate = document.getElementById('task-start-input').value || getToday();
  const notes = document.getElementById('task-notes-input').value;

  // Geri döndü → schedule + beklemede
  if (finalStatus === 'geri') {
    finalCat = 'schedule';
    finalStatus = 'beklemede';
  }

  if (editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    if (t) {
      const changes = [];
      if (t.status !== finalStatus) changes.push(`${L.statuses[t.status]} → ${L.statuses[finalStatus]}`);
      if (t.category !== finalCat) changes.push(`${L.categories[t.category]} → ${L.categories[finalCat]}`);
      if (t.delegateTo !== finalDelegateTo && finalDelegateTo) changes.push(`👤 ${finalDelegateTo}`);
      t.version = (t.version || 1) + 1;
      if (changes.length > 0) addLog(t, changes.join(' | '));
      Object.assign(t, {
        name, category: finalCat, status: finalStatus,
        delegateTo: finalDelegateTo, deadline, dateCreated: startDate, notes
      });
    }
  } else {
    const newTask = {
      id: Date.now().toString(), name,
      category: finalCat, status: finalStatus,
      delegateTo: finalDelegateTo, deadline,
      dateCreated: startDate, notes,
      version: 1, logs: []
    };
    addLog(newTask, `✨ ${L.newTask}`);
    tasks.push(newTask);
  }

  saveTasks();
  closeModal();
  renderAll();
};

// ============ YEDEKLE ============
window.downloadTasks = () => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute('href', dataStr);
  dl.setAttribute('download', `tasks_backup_${getToday()}.json`);
  dl.click();
};

// ============ DİL ============
window.setLang = (l) => {
  currentLang = l;
  localStorage.setItem('lang', l);
  renderAll();
};

// ============ ARŞİV ============
window.toggleArchive = () => {
  showArchive = !showArchive;
  renderAll();
};

// ============ RENDER MATRİS ============
function renderMatrix() {
  const today = getToday();
  const active = tasks.filter(t => t.status !== 'tamamlandi');
  ['do', 'schedule', 'delegate', 'eliminate'].forEach(q => {
    const el = document.getElementById(`tasks-${q}`);
    if (!el) return;
    el.innerHTML = active.filter(t => t.category === q).map(t => {
      const style = STATUS_CHIP_STYLE[t.status] || STATUS_CHIP_STYLE.beklemede;
      const overdue = t.deadline && t.deadline < today && t.status !== 'tamamlandi';
      return `
        <div class="task-chip ${overdue ? 'overdue' : ''}"
             style="border:${style.border};background:${style.background}"
             draggable="true"
             ondragstart="drag(event,'${t.id}')"
             onclick="openEditModal('${t.id}')">
          <span class="ver-tag">v${t.version || 1}</span>
          <div class="chip-name">${getStatusIcon(t.status)} ${t.name}</div>
          <div class="chip-meta">
            <span>${formatDate(t.deadline)}</span>
            <span>${t.delegateTo ? '👤 ' + t.delegateTo : ''}</span>
          </div>
        </div>
      `;
    }).join('');
  });
}

function getStatusIcon(status) {
  const icons = { beklemede: '🟡', devam: '🟢', delege: '🟠', geri: '🔴', tamamlandi: '⚫' };
  return icons[status] || '🟡';
}

// ============ RENDER TABLO ============
function renderTable() {
  const L = getLang();
  const today = getToday();
  const active = tasks.filter(t => t.status !== 'tamamlandi');
  const filtered = showArchive ? tasks.filter(t => t.status === 'tamamlandi') : active;

  document.getElementById('archive-toggle').textContent = showArchive ? L.hideArchive : L.showArchive;

  if (filtered.length === 0) {
    document.getElementById('task-tbody').innerHTML =
      `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px">—</td></tr>`;
    return;
  }

  document.getElementById('task-tbody').innerHTML = filtered.map(t => {
    const overdue = t.deadline && t.deadline < today && t.status !== 'tamamlandi';
    return `
      <tr>
        <td style="color:#bbb;font-weight:bold;font-size:0.75rem">v${t.version || 1}</td>
        <td onclick="openEditModal('${t.id}')" style="cursor:pointer;font-weight:600">${t.name}</td>
        <td style="font-size:0.7rem;color:#999">${formatDate(t.dateCreated)}</td>
        <td style="color:${overdue ? '#ff4d4d' : 'inherit'}">${formatDate(t.deadline)}</td>
        <td>
          <span style="font-size:0.8rem">${L.statuses[t.status] || t.status}</span>
          ${t.delegateTo ? `<br><span class="delegate-badge">👤 ${t.delegateTo}</span>` : ''}
        </td>
        <td onclick="openEditModal('${t.id}')" style="cursor:pointer;color:#888;font-size:0.78rem">
          ${t.notes ? t.notes.substring(0, 30) + (t.notes.length > 30 ? '…' : '') : '—'}
        </td>
      </tr>
    `;
  }).join('');
}

// ============ RENDER ALL ============
function renderAll() {
  const L = getLang();

  document.getElementById('app-name').textContent = L.appName;
  document.getElementById('pool-title').textContent = L.taskPool;
  document.getElementById('btn-add').textContent = L.addTask;
  document.getElementById('label-do').textContent = L.do;
  document.getElementById('label-schedule').textContent = L.schedule;
  document.getElementById('label-delegate').textContent = L.delegate;
  document.getElementById('label-eliminate').textContent = L.eliminate;
  document.getElementById('sub-do').textContent = L.urgent;
  document.getElementById('sub-schedule').textContent = L.notUrgent;
  document.getElementById('sub-delegate').textContent = L.urgentNotImportant;
  document.getElementById('sub-eliminate').textContent = L.neither;
  document.getElementById('th-name').textContent = L.taskName;
  document.getElementById('th-created').textContent = L.dateIn;
  document.getElementById('th-deadline').textContent = L.dateOut;
  document.getElementById('th-status').textContent = L.status;
  document.getElementById('th-notes').textContent = L.notes;

  ['tr', 'en', 'it'].forEach(l => {
    const btn = document.getElementById(`lang-${l}`);
    if (btn) btn.classList.toggle('active', l === currentLang);
  });

  renderMatrix();
  renderTable();
}

// ============ INIT ============
window.onload = () => {
  checkDailyTransfer();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/task-eisenhower/sw.js').catch(() => {});
  }
  renderAll();
};
