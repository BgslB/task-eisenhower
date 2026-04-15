const LANGS = {
  tr: {
    appName: 'GÖREV MATRİSİ', do: 'Hemen Yap', schedule: 'Planla', delegate: 'Delege Et', eliminate: 'Yapma / Sil',
    urgent: 'ACİL & ÖNEMLİ', notUrgent: 'ÖNEMLİ, ACİL DEĞİL', urgentNotImportant: 'ACİL, ÖNEMLİ DEĞİL', neither: 'NE ACİL NE ÖNEMLİ',
    taskPool: 'GÖREV HAVUZU', addTask: '+ Görev Ekle', taskName: 'Görev', dateIn: 'Giriş', dateOut: 'Bitiş',
    status: 'Durum/Kime', notes: 'Notlar', save: 'Kaydet', cancel: 'İptal',
    statuses: { beklemede: '🟡 Beklemede', devam: '🔵 In Corso (Devam Ediyor)', delege: '🟠 Delege Edildi', geri: '🔴 Ritorno (Geri Döndü)', tamamlandi: '✅ Tamamlandı' },
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

// --- DRAG & DROP ---
window.allowDrop = (ev) => ev.preventDefault();
window.drag = (ev, id) => ev.dataTransfer.setData("text", id);
window.drop = (ev, category) => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text");
    const t = tasks.find(x => x.id === id);
    if(t) {
        t.category = category;
        // Senkronizasyon
        if(category === 'delegate') t.status = 'delege';
        else if(category === 'schedule') t.status = 'beklemede';
        else if(category === 'do' && t.status === 'beklemede') t.status = 'devam';
        
        // Versiyon artır (Sürükleme de bir işlemdir)
        t.version = (t.version >= 3) ? 1 : (t.version || 1) + 1;

        saveTasks();
        renderAll();
    }
};

// --- MANTIKSAL SENKRONİZASYON ---
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
    if (stat === 'delege') catEl.value = 'delegate';
    toggleDelegateField();
};

window.toggleDelegateField = () => {
  const status = document.getElementById('task-status-input').value;
  const wrapper = document.getElementById('delegate-to-wrapper');
  if(wrapper) wrapper.style.display = (status === 'delege') ? 'block' : 'none';
};

// --- CORE ---
window.setLang = (l) => { currentLang = l; localStorage.setItem('lang', l); renderAll(); };
window.toggleArchive = () => { showArchive = !showArchive; renderAll(); };

window.openAddModal = () => {
  editingTaskId = null;
  populateModalDropdowns();
  document.getElementById('task-name-input').value = '';
  document.getElementById('task-delegate-input').value = '';
  document.getElementById('task-deadline-input').value = '';
  document.getElementById('task-notes-input').value = '';
  toggleDelegateField();
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

function populateModalDropdowns() {
  const L = getLang();
  document.getElementById('task-category-input').innerHTML = Object.entries(L.categories).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  document.getElementById('task-status-input').innerHTML = Object.entries(L.statuses).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}

window.saveModal = () => {
  const name = document.getElementById('task-name-input').value.trim();
  if(!name) return;

  const statVal = document.getElementById('task-status-input').value;
  let finalStatus = statVal;
  let finalDelTo = document.getElementById('task-delegate-input').value;
  let finalCat = document.getElementById('task-category-input').value;

  // RITORNO (Geri Döndü) Kontrolü
  if(statVal === 'geri') {
    finalStatus = 'devam';
    finalDelTo = '';
    finalCat = 'do';
  }

  if(editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    if(t) {
      t.version = (t.version >= 3) ? 1 : (t.version || 1) + 1;
      Object.assign(t, { 
        name, category: finalCat, status: finalStatus, 
        delegateTo: finalDelTo,
        deadline: document.getElementById('task-deadline-input').value,
        notes: document.getElementById('task-notes-input').value
      });
    }
  } else {
    tasks.push({ 
      id: Date.now().toString(), name, category: finalCat, 
      status: finalStatus, delegateTo: finalDelTo,
      deadline: document.getElementById('task-deadline-input').value,
      notes: document.getElementById('task-notes-input').value,
      dateCreated: getToday(), version: 1 
    });
  }
  saveTasks(); closeModal(); renderAll();
};

window.downloadTasks = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "tasks_backup.json");
    dl.click();
};

function renderAll() {
  const L = getLang();
  const today = getToday();
  const active = tasks.filter(t => t.status !== 'tamamlandi');
  
  // Header & Labels
  document.getElementById('app-name').textContent = L.appName;
  document.getElementById('pool-title').textContent = L.taskPool;
  document.getElementById('btn-add').textContent = L.addTask;
  document.getElementById('label-do').textContent = L.do;
  document.getElementById('label-schedule').textContent = L.schedule;
  document.getElementById('label-delegate').textContent = L.delegate;
  document.getElementById('label-eliminate').textContent = L.eliminate;
  
  ['tr','en','it'].forEach(l => document.getElementById(`lang-${l}`).classList.toggle('active', l === currentLang));

  // Matrix
  ['do','schedule','delegate','eliminate'].forEach(q => {
    document.getElementById(`tasks-${q}`).innerHTML = active.filter(t => t.category === q).map(t => `
      <div class="task-chip ${t.deadline && t.deadline < today ? 'overdue' : ''}" 
           draggable="true" ondragstart="drag(event, '${t.id}')"
           onclick="openEditModal('${t.id}')">
        <span class="ver-tag">v${t.version || 1}</span>
        <div style="font-weight:600; padding-right:20px;">${t.name}</div>
        <div class="chip-meta">
          <span>${formatDate(t.deadline)}</span>
          <span>${t.delegateTo ? '👤 '+t.delegateTo : ''}</span>
        </div>
      </div>
    `).join('');
  });

  // Table
  const filtered = showArchive ? tasks.filter(t => t.status === 'tamamlandi') : active;
  document.getElementById('task-tbody').innerHTML = filtered.map(t => `
    <tr>
      <td style="color:#bbb; font-weight:bold">v${t.version || 1}</td>
      <td onclick="openEditModal('${t.id}')" style="cursor:pointer; font-weight:600">${t.name}</td>
      <td style="font-size:0.7rem; color:#999">${formatDate(t.dateCreated)}</td>
      <td style="color:${t.deadline < today && t.status !== 'tamamlandi' ? '#ff4d4d' : 'inherit'}">${formatDate(t.deadline)}</td>
      <td>
        <span style="font-size:0.8rem">${L.statuses[t.status]}</span>
        ${t.delegateTo ? `<br><span class="delegate-badge">${t.delegateTo}</span>` : ''}
      </td>
      <td onclick="openEditModal('${t.id}')">${t.notes ? (t.notes.substring(0,25)+'...') : '...'}</td>
    </tr>
  `).join('');
}

window.onload = renderAll;