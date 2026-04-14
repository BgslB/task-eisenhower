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

// ============ GÜNLÜK AKTARIM ============
function checkDailyTransfer() {
  const today = new Date().toISOString().split('T')[0];
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

// ============ YARDIMCI FONKSİYONLAR ============
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getLang() {
  return LANGS[currentLang];
}

// ============ RENDER MATRİS ============
function renderMatrix() {
  const L = getLang();
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

function getStatusIcon(status) {
  const icons = {
    beklemede: '🟡',
    devam: '🔵',
    delege: '🟠',
    geri: '🔴',
    tamamlandi: '✅'
  };
  return icons[status] || '🟡';
}

// ============ RENDER TABLO ============
function renderTable() {
  const L = getLang();
  const today = getToday();
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
          ${['do','schedule','delegate','eliminate'].map(c => `
            <option value="${c}" ${t.category === c ? 'selected' : ''}>${c.toUpperCase()}</option>
          `).join('')}
        </select>
      </td>
      <td>
      