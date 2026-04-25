// ─── STATE ────────────────────────────────────────────────
let tasks  = JSON.parse(localStorage.getItem('taskly-tasks')  || '[]');
let filter = 'all';
let editingId  = null;
let dragSrcId  = null;
let toastTimer = null;

// ─── INIT ─────────────────────────────────────────────────
document.getElementById('date-line').textContent =
  new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// Dark mode
if (localStorage.getItem('taskly-dark') === '1') {
  document.body.classList.add('dark');
  document.getElementById('theme-toggle').textContent = '☀️';
}

// Enter key on task input
document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// Close modal on overlay click
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

render();

// ─── STORAGE ──────────────────────────────────────────────
function save() {
  localStorage.setItem('taskly-tasks', JSON.stringify(tasks));
}

// ─── DARK MODE ────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('taskly-dark', isDark ? '1' : '0');
}

// ─── ADD TASK ─────────────────────────────────────────────
function addTask() {
  const text = document.getElementById('task-input').value.trim();
  if (!text) {
    showToast('⚠️ Please enter a task name.');
    return;
  }
  tasks.unshift({
    id:       Date.now(),
    text,
    done:     false,
    priority: document.getElementById('task-priority').value,
    category: document.getElementById('task-category').value,
    due:      document.getElementById('task-due').value,
    notes:    '',
    created:  Date.now(),
  });
  document.getElementById('task-input').value    = '';
  document.getElementById('task-due').value      = '';
  document.getElementById('task-category').value = '';
  document.getElementById('task-priority').value = 'med';
  save();
  render();
  showToast('✅ Task added!');
}

// ─── TOGGLE DONE ──────────────────────────────────────────
function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  if (t.done) {
    launchConfetti();
    showToast('🎉 Task completed!');
  }
  save();
  render();
}

// ─── DELETE ───────────────────────────────────────────────
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
  showToast('🗑️ Task deleted.');
}

// ─── CLEAR ALL ────────────────────────────────────────────
function openConfirm() {
  if (tasks.length === 0) { showToast('No tasks to clear.'); return; }
  document.getElementById('confirm-modal').classList.add('open');
}
function closeConfirm() {
  document.getElementById('confirm-modal').classList.remove('open');
}
function confirmClearAll() {
  tasks = [];
  save();
  render();
  closeConfirm();
  showToast('🗑️ All tasks cleared.');
}

// ─── EDIT MODAL ───────────────────────────────────────────
function openEdit(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  editingId = id;
  document.getElementById('edit-text').value     = t.text;
  document.getElementById('edit-priority').value = t.priority;
  document.getElementById('edit-category').value = t.category || '';
  document.getElementById('edit-due').value      = t.due || '';
  document.getElementById('edit-notes').value    = t.notes || '';
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  editingId = null;
}
function saveEdit() {
  const t = tasks.find(t => t.id === editingId);
  if (!t) return;
  const newText = document.getElementById('edit-text').value.trim();
  if (!newText) { showToast('⚠️ Task name cannot be empty.'); return; }
  t.text     = newText;
  t.priority = document.getElementById('edit-priority').value;
  t.category = document.getElementById('edit-category').value;
  t.due      = document.getElementById('edit-due').value;
  t.notes    = document.getElementById('edit-notes').value.trim();
  save();
  render();
  closeModal();
  showToast('✏️ Task updated!');
}

// ─── FILTER ───────────────────────────────────────────────
function setFilter(btn, f) {
  filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function getFiltered() {
  const today  = new Date().toISOString().split('T')[0];
  const query  = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const sort   = document.getElementById('sort-select')?.value || 'default';

  let result = tasks.filter(t => {
    if (filter === 'active')  return !t.done;
    if (filter === 'done')    return  t.done;
    if (filter === 'high')    return  t.priority === 'high';
    if (filter === 'overdue') return !t.done && t.due && t.due < today;
    if (filter === 'today')   return  t.due === today;
    return true;
  });

  // search
  if (query) {
    result = result.filter(t =>
      t.text.toLowerCase().includes(query) ||
      (t.notes && t.notes.toLowerCase().includes(query)) ||
      (t.category && t.category.toLowerCase().includes(query))
    );
  }

  // sort
  const prioOrder = { high: 0, med: 1, low: 2 };
  if (sort === 'priority') {
    result = [...result].sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]);
  } else if (sort === 'due') {
    result = [...result].sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });
  } else if (sort === 'alpha') {
    result = [...result].sort((a, b) => a.text.localeCompare(b.text));
  } else if (sort === 'created') {
    result = [...result].sort((a, b) => (b.created || b.id) - (a.created || a.id));
  }

  return result;
}

// ─── RENDER ───────────────────────────────────────────────
function render() {
  const list     = document.getElementById('task-list');
  const filtered = getFiltered();
  const today    = new Date().toISOString().split('T')[0];

  // Stats
  const totalTasks   = tasks.length;
  const activeTasks  = tasks.filter(t => !t.done).length;
  const doneTasks    = tasks.filter(t =>  t.done).length;
  const overdueTasks = tasks.filter(t => !t.done && t.due && t.due < today).length;

  document.getElementById('stat-total').textContent   = totalTasks;
  document.getElementById('stat-active').textContent  = activeTasks;
  document.getElementById('stat-done').textContent    = doneTasks;
  document.getElementById('stat-overdue').textContent = overdueTasks;

  // Progress bar
  const pct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = pct + '% complete';

  // Empty state
  if (!filtered.length) {
    const msg = filter === 'all' && !document.getElementById('search-input').value
      ? 'No tasks yet. Add one above!'
      : 'No tasks match this filter.';
    list.innerHTML = `<div class="empty">
      <div class="empty-icon">${filter === 'done' ? '🏆' : filter === 'overdue' ? '✅' : '📋'}</div>
      <p>${msg}</p>
    </div>`;
    return;
  }

  list.innerHTML = '';

  const catLabels = {
    work: '💼 Work', personal: '🏠 Personal', school: '🎓 School',
    health: '💪 Health', other: '⚡ Other'
  };

  filtered.forEach(t => {
    const isOverdue = !t.done && t.due && t.due < today;
    const isToday   = t.due === today;
    let dueFmt = '';
    if (t.due) {
      dueFmt = new Date(t.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const div = document.createElement('div');
    div.className = `task-item prio-${t.priority}${t.done ? ' done' : ''}`;
    div.dataset.id = t.id;
    div.draggable = true;

    const dueClass = isOverdue ? ' overdue' : isToday ? ' today' : '';
    const duePrefix = isOverdue ? '⚠️ ' : isToday ? '🔔 Today · ' : '📅 ';

    div.innerHTML = `
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      <div class="task-check" onclick="toggleDone(${t.id})" title="Mark complete">
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5l3.5 3.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="task-body">
        <div class="task-text">${escHtml(t.text)}</div>
        ${t.notes ? `<div class="task-notes">${escHtml(t.notes)}</div>` : ''}
        <div class="task-meta">
          <span class="badge ${t.priority}">${t.priority === 'high' ? 'High' : t.priority === 'med' ? 'Medium' : 'Low'}</span>
          ${t.category ? `<span class="cat-badge">${catLabels[t.category] || t.category}</span>` : ''}
          ${dueFmt ? `<span class="due-label${dueClass}">${duePrefix}${dueFmt}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" onclick="openEdit(${t.id})" title="Edit">✏️</button>
        <button class="icon-btn del" onclick="deleteTask(${t.id})" title="Delete">🗑️</button>
      </div>
    `;

    // drag events
    div.addEventListener('dragstart', () => {
      dragSrcId = t.id;
      div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
      clearDragOver();
    });
    div.addEventListener('dragover', e => {
      e.preventDefault();
      clearDragOver();
      div.classList.add('drag-over');
    });
    div.addEventListener('drop', e => {
      e.preventDefault();
      dropTask(t.id);
    });

    list.appendChild(div);
  });
}

function clearDragOver() {
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function dropTask(targetId) {
  if (dragSrcId === targetId) return;
  const from = tasks.findIndex(t => t.id === dragSrcId);
  const to   = tasks.findIndex(t => t.id === targetId);
  if (from === -1 || to === -1) return;
  const [moved] = tasks.splice(from, 1);
  tasks.splice(to, 0, moved);
  save();
  render();
}

// ─── ESCAPE HTML ──────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── CONFETTI ─────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#0d9488','#14b8a6','#0ea5e9','#f59e0b','#10b981','#f43f5e','#a78bfa'];
  const pieces = Array.from({ length: 130 }, () => ({
    x:         Math.random() * canvas.width,
    y:         -20,
    r:         Math.random() * 7 + 3,
    color:     colors[Math.floor(Math.random() * colors.length)],
    tilt:      Math.random() * 10 - 5,
    tiltAngle: 0,
    tiltSpeed: Math.random() * .1 + .05,
    speed:     Math.random() * 3 + 2,
    opacity:   1,
  }));

  let frame, tick = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tick++;
    pieces.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y         += p.speed;
      p.tilt       = Math.sin(p.tiltAngle) * 12;
      if (tick > 80) p.opacity = Math.max(0, p.opacity - .02);
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r * .4, p.tiltAngle, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (tick < 150) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  cancelAnimationFrame(frame);
  draw();
}
