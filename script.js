// State
let tasks = JSON.parse(localStorage.getItem('taskly-tasks') || '[]');
let filter = 'all';
let editingId = null;
let dragSrcId = null;

// Init
document.getElementById('date-line').textContent =
  new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

render();

// Save to localStorage
function save() {
  localStorage.setItem('taskly-tasks', JSON.stringify(tasks));
}

// Add task
function addTask() {
  const text = document.getElementById('task-input').value.trim();
  if (!text) return;
  tasks.unshift({
    id: Date.now(),
    text,
    done: false,
    priority: document.getElementById('task-priority').value,
    due: document.getElementById('task-due').value,
  });
  document.getElementById('task-input').value = '';
  save();
  render();
}

// Toggle done
function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  if (t.done) launchConfetti();
  save();
  render();
}

// Delete
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

// Edit modal
function openEdit(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  editingId = id;
  document.getElementById('edit-text').value = t.text;
  document.getElementById('edit-priority').value = t.priority;
  document.getElementById('edit-due').value = t.due || '';
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  editingId = null;
}

function saveEdit() {
  const t = tasks.find(t => t.id === editingId);
  if (!t) return;
  t.text     = document.getElementById('edit-text').value.trim() || t.text;
  t.priority = document.getElementById('edit-priority').value;
  t.due      = document.getElementById('edit-due').value;
  save();
  render();
  closeModal();
}

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// Filter
function setFilter(btn, f) {
  filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function getFiltered() {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter(t => {
    if (filter === 'active')  return !t.done;
    if (filter === 'done')    return t.done;
    if (filter === 'high')    return t.priority === 'high';
    if (filter === 'overdue') return !t.done && t.due && t.due < today;
    return true;
  });
}

// Render
function render() {
  const list = document.getElementById('task-list');
  const filtered = getFiltered();

  document.getElementById('stat-total').textContent  = tasks.length;
  document.getElementById('stat-active').textContent = tasks.filter(t => !t.done).length;
  document.getElementById('stat-done').textContent   = tasks.filter(t => t.done).length;

  if (!filtered.length) {
    list.innerHTML = `<div class="empty">
      <div class="empty-icon">✅</div>
      <p>${filter === 'all' ? 'No tasks yet. Add one above!' : 'Nothing here.'}</p>
    </div>`;
    return;
  }

  list.innerHTML = '';
  const today = new Date().toISOString().split('T')[0];

  filtered.forEach(t => {
    const isOverdue = !t.done && t.due && t.due < today;
    const dueFmt = t.due
      ? new Date(t.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';

    const div = document.createElement('div');
    div.className = `task-item prio-${t.priority}${t.done ? ' done' : ''}`;
    div.dataset.id = t.id;
    div.draggable = true;

    div.innerHTML = `
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      <div class="task-check" onclick="toggleDone(${t.id})" title="Mark complete">
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5l3.5 3.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="task-body">
        <div class="task-text" title="${t.text}">${t.text}</div>
        <div class="task-meta">
          <span class="badge ${t.priority}">${t.priority === 'high' ? 'High' : t.priority === 'med' ? 'Medium' : 'Low'}</span>
          ${dueFmt ? `<span class="due-label${isOverdue ? ' overdue' : ''}">
            ${isOverdue ? '⚠️ ' : '📅 '}${dueFmt}
          </span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" onclick="openEdit(${t.id})" title="Edit">✏️</button>
        <button class="icon-btn del" onclick="deleteTask(${t.id})" title="Delete">🗑️</button>
      </div>
    `;

    div.addEventListener('dragstart', () => { dragSrcId = t.id; div.classList.add('dragging'); });
    div.addEventListener('dragend',   () => { div.classList.remove('dragging'); clearDragOver(); });
    div.addEventListener('dragover',  e => { e.preventDefault(); clearDragOver(); div.classList.add('drag-over'); });
    div.addEventListener('drop',      e => { e.preventDefault(); dropTask(t.id); });

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

// Confetti
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#0d9488', '#14b8a6', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa'];
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    r: Math.random() * 7 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 5,
    tiltAngle: 0,
    tiltSpeed: Math.random() * .1 + .05,
    speed: Math.random() * 3 + 2,
    opacity: 1,
  }));

  let frame;
  let tick = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tick++;
    pieces.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y += p.speed;
      p.tilt = Math.sin(p.tiltAngle) * 12;
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
