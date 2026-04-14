// ============ DİL SİSTEMİ ============
const LANGS = {
  tr: {
    appName: 'GÖREV MATRİSİ',
    do: 'Hemen Yap',
    schedule: 'Planla',
    delegate: 'Delege Et',
    eliminate: 'Yapma / Sil',
    urgent: 'ACİL & ÖNEMLİ',
    notUrgent: 'ÖNEMLİ, ACİL DEĞİL',
    urgentNotImportant: 'ACİL, ÖNEMLİ DEĞİL',
    neither: 'NE ACİL NE ÖNEMLİ',
    taskPool: 'GÖREV HAVUZU',
    addTask: '+ Görev Ekle',
    taskName: 'Görev Adı',
    date: 'Tarih',
    category: 'Kategori',
    status: 'Durum',
    notes: 'Notlar',
    save: 'Kaydet',
    cancel: 'İptal',
    newTask: 'Yeni Görev',
    taskNamePlaceholder: 'Görev adını girin...',
    notesPlaceholder: 'Notlar...',
    statuses: {
      beklemede: '🟡 Beklemede',
      devam: '🔵 Devam Ediyor',
      delege: '🟠 Delege Edildi',
      geri: '🔴 Geri Döndü',
      tamamlandi: '✅ Tamamlandı'
    },
    categories: {
      do: 'DO - Hemen Yap',
      schedule: 'SCHEDULE - Planla',
      delegate: 'DELEGATE - Delege Et',
      eliminate: 'ELIMINATE - Yapma'
    },
    showArchive: 'Arşivi Göster',
    hideArchive: 'Arşivi Gizle',
    archive: 'ARŞİV'
  },
  en: {
    appName: 'TASK MATRIX',
    do: 'Do Now',
    schedule: 'Schedule',
    delegate: 'Delegate',
    eliminate: 'Eliminate',
    urgent: 'URGENT & IMPORTANT',
    notUrgent: 'IMPORTANT, NOT URGENT',
    urgentNotImportant: 'URGENT, NOT IMPORTANT',
    neither: 'NEITHER URGENT NOR IMPORTANT',
    taskPool: 'TASK POOL',
    addTask: '+ Add Task',
    taskName: 'Task Name',
    date: 'Date',
    category: 'Category',
    status: 'Status',
    notes: 'Notes',
    save: 'Save',
    cancel: 'Cancel',
    newTask: 'New Task',
    taskNamePlaceholder: 'Enter task name...',
    notesPlaceholder: 'Notes...',
    statuses: {
      beklemede: '🟡 Pending',
      devam: '🔵 In Progress',
      delege: '🟠 Delegated',
      geri: '🔴 Returned',
      tamamlandi: '✅ Completed'
    },
    categories: {
      do: 'DO - Do Now',
      schedule: 'SCHEDULE - Plan',
      delegate: 'DELEGATE - Delegate',
      eliminate: 'ELIMINATE - Remove'
    },
    showArchive: 'Show Archive',
    hideArchive: 'Hide Archive',
    archive: 'ARCHIVE'
  },
  it: {
    appName: 'MATRICE ATTIVITÀ',
    do: 'Fai Ora',
    schedule: 'Pianifica',
    delegate: 'Delega',
    eliminate: 'Elimina',
    urgent: 'URGENTE & IMPORTANTE',
    notUrgent: 'IMPORTANTE, NON URGENTE',
    urgentNotImportant: 'URGENTE, NON IMPORTANTE',
    neither: 'NÉ URGENTE NÉ IMPORTANTE',
    taskPool: 'POOL ATTIVITÀ',
    addTask: '+ Aggiungi',
    taskName: 'Nome Attività',
    date: 'Data',
    category: 'Categoria',
    status: 'Stato',
    notes: 'Note',
    save: 'Salva',
    cancel: 'Annulla',
    newTask: 'Nuova Attività',
    taskNamePlaceholder: 'Inserisci nome attività...',
    notesPlaceholder: 'Note...',
    statuses: {
      beklemede: '🟡 In Attesa',
      devam: '🔵 In Corso',
      delege: '🟠 Delegato',
      geri: '🔴 Ritornato',
      tamamlandi: '✅ Completato'
    },
    categories: {
      do: 'DO - Fai Ora',
      schedule: 'SCHEDULE - Pianifica',
      delegate: 'DELEGATE - Delega',
      eliminate: 'ELIMINATE - Elimina'
    },
    showArchive: 'Mostra Archivio',
    hideArchive: 'Nascondi Archivio',
    archive: 'ARCHIVIO'
  }
};

// ============ DURUM → KATEGORİ KURALLARI ============
const STATUS_TO_CATEGORY = {
  devam: 'do',
  delege: 'delegate',
  geri: 'do',
  beklemede: null,
  tamamlandi: null
};

// ============ STATE ============
let currentLang = localStorage.getItem('lang') || 'tr';
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let showArchive = false;
let editingTaskId = null;

// ============ YARDIMCI FONKSİYONLAR ============
function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
function getToday() { return new Date().toISOString().split('T')[0]; }
function formatDate(dateStr) { if(!dateStr) return ""; const [y, m, d] = dateStr.split('-'); return `${d}.${m}.${y}`; }
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function getLang() { return LANGS[currentLang]; }
function getStatusIcon(status) {
  const icons = { beklemede: '🟡', devam: '🔵', delege: '🟠', geri: '🔴', tamamlandi: '✅' };
  return icons[status] || '🟡';
}

// ============ GÜNLÜK AKTARIM ============
function checkDailyTransfer() {
  const today = getToday();
  const lastOpen = localStorage.getItem('lastOpen');
  if (lastOpen && lastOpen !== today) {
    tasks = tasks.map(task => {
      if (task.status !== 'tamamlandi' && task.date !== today) {
        return { ...task, date: today, transferredFrom: task.date };
      }
      return task;
    });
    saveTasks();
  }
  localStorage.setItem('lastOpen', today);
}

// ============ GLOBAL FONKSİYONLAR (Window'a bağlı) ============
window.setLang = function(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  renderAll();
};

window.updateStatus = function(id, newStatus) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = newStatus;
  const autoCategory = STATUS_TO_CATEGORY[newStatus];
  if (autoCategory) task.category = autoCategory;
  saveTasks();
  renderAll();
};

window.updateCategory = function(id, newCategory) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.category = newCategory;
  saveTasks();
  renderAll();
};

window.openAddModal = function() {
  editingTaskId = null;
  const L = getLang();
  document.getElementById('modal-title').textContent = L.newTask;
  document.getElementById('task-name-input').value = '';
  document.getElementById('task-category-input').value = 'do';
  document.getElementById('task-status-input').value = 'beklemede';
  document.getElementById('task-notes-input').value = '';
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.openEditModal = function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  document.getElementById('modal-title').textContent = task.name;
  document.getElementById('task-name-input').value = task.name;
  document.getElementById('task-category-input').value = task.category;
  document.getElementById('task-status-input').value = task.status;
  document.getElementById('task-notes-input').value = task.notes || '';
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.closeModal = function() {
  document.getElementById('modal-overlay').style.display = 'none';
  editingTaskId = null;
};

window.saveModal = function() {
  const name = document.getElementById('task-name-input').value.trim();
  if (!name) return;
  const category = document.getElementById('task-category-input').value;
  const status = document.getElementById('task-status-input').value;
  const notes = document.getElementById('task-notes-input').value.trim();

  if (editingTaskId) {
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
      task.name = name;
      task.category = category;
      task.status = status;
      task.notes = notes;
    }
  } else {
    tasks.push({ id: generateId(), name, category, status, notes, date: getToday() });
  }
  saveTasks();
  window.closeModal();
  renderAll();
};

window.toggleArchive = function() {
  showArchive = !showArchive;
  renderAll();
};

// ============ RENDER SİSTEMİ ============
function renderMatrix() {
  const activeTasks = tasks.filter(t => t.status !== 'tamamlandi');
  ['do', 'schedule', 'delegate', 'eliminate'].forEach(q => {
    const container = document.getElementById(`tasks-${q}`);
    if (!container) return;
    const qTasks = activeTasks.filter(t => t.category === q);
    container.innerHTML = qTasks.map(t => `
      <div class="task-chip" onclick="openEditModal('${t.id}')">
        <span>${getStatusIcon(t.status)}</span>
        <span>${t.name}</span>
      </div>
    `).join('');
  });
}

function renderTable() {
  const L = getLang();
  const tbody = document.getElementById('task-tbody');
  if (!tbody) return;

  const filtered = showArchive
    ? tasks.filter(t => t.status === 'tamamlandi')
    : tasks.filter(t => t.status !== 'tamamlandi');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px;">—</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => `
    <tr>
      <td style="font-weight:500">${t.name}${t.transferredFrom ? `<br><span style="font-size:0.7rem;color:#aaa">← ${formatDate(t.transferredFrom)}</span>` : ''}</td>
      <td style="white-space:nowrap">${formatDate(t.date)}</td>
      <td>
        <select onchange="updateCategory('${t.id}', this.value)">
          ${['do','schedule','delegate','eliminate'].map(c => `<option value="${c}" ${t.category === c ? 'selected' : ''}>${c.toUpperCase()}</option>`).join('')}
        </select>
      </td>
      <td>
        <select onchange="updateStatus('${t.id}', this.value)">
          ${Object.entries(L.statuses).map(([k,v]) => `<option value="${k}" ${t.status === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </td>
      <td style="color:#888;font-size:0.78rem;max-width:150px">${t.notes || '—'}</td>
    </tr>
  `).join('');
}

function renderAll() {
  const L = getLang();
  // Yazıları Güncelle
  document.getElementById('app-name').textContent = L.appName;
  document.getElementById('label-do').textContent = L.do;
  document.getElementById('label-schedule').textContent = L.schedule;
  document.getElementById('label-delegate').textContent = L.delegate;
  document.getElementById('label-eliminate').textContent = L.eliminate;
  document.getElementById('sub-do').textContent = L.urgent;
  document.getElementById('sub-schedule').textContent = L.notUrgent;
  document.getElementById('sub-delegate').textContent = L.urgentNotImportant;
  document.getElementById('sub-eliminate').textContent = L.neither;
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
  
  // Dil Butonlarını Güncelle
  ['tr','en','it'].forEach(l => {
    document.getElementById(`lang-${l}`).classList.toggle('active', l === currentLang);
  });

  renderMatrix();
  renderTable();
}

// ============ INIT ============
window.onload = () => {
  checkDailyTransfer();
  renderAll();
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
};