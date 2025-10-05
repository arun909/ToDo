// initial.js — entry point
import './addTask.js';
import './viewByDate.js';
import './viewCompleted.js';

(function createStore(){
  const STORAGE_KEY = 'todo_tasks_v1';
  let tasks = [];

  function load(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
      tasks = [];
    }
  }

  function save(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {}
  }

  function generateID(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  }

  function addTask({title, description, date, priority = 'medium'}){
    const t = {
      id: generateID(),
      title,
      description,
      date,
      priority,
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.push(t);
    save();
    return t;
  }

  function updateTask(updated){
    tasks = tasks.map(t => t.id === updated.id ? updated : t);
    save();
  }

  function removeTask(id){
    tasks = tasks.filter(t => t.id !== id);
    save();
  }

  function toggleComplete(id){
    const t = tasks.find(x => x.id === id);
    if (t) {
      t.completed = !t.completed;
      save();
      return t;
    }
  }

  function getAll(){
    return [...tasks];
  }

  function getByDate(dateStr){
    return tasks
      .filter(t => t.date === dateStr)
      .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  function getCompleted(){
    return tasks
      .filter(t => t.completed)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  window.todoStore = {
    load,
    save,
    addTask,
    updateTask,
    removeTask,
    toggleComplete,
    getAll,
    getByDate,
    getCompleted
  };

  load();
})();

/* helpers */
function todayISO(){ return new Date().toISOString().split('T')[0]; }
function $id(id){ return document.getElementById(id); }

/* DOM refs (may be null until DOM ready) */
const pageTitle = $id('pageTitle');
const navToday = $id('nav-today');
const navCalendar = $id('nav-calendar');
const navCompleted = $id('nav-completed');
const navAdd = $id('nav-add');
const todayView = $id('todayView');
const calendarView = $id('calendarView');
const completedView = $id('completedView');

/* show/hide views */
function showView(view){
  if (pageTitle) {
    pageTitle.textContent = view === 'today' ? 'Today' : (view === 'calendar' ? 'Calendar' : 'Completed');
  }

  if (todayView) {
    todayView.style.display = view === 'today' ? '' : 'none';
  }
  if (calendarView) {
    calendarView.style.display = view === 'calendar' ? '' : 'none';
  }
  if (completedView) {
    completedView.style.display = view === 'completed' ? '' : 'none';
  }

  if (navToday) navToday.classList.toggle('active', view === 'today');
  if (navCalendar) navCalendar.classList.toggle('active', view === 'calendar');
  if (navCompleted) navCompleted.classList.toggle('active', view === 'completed');
}

/* build task element */
function buildTaskElement(task){
  const el = document.createElement('div');
  el.className = 'task-item';
  el.dataset.id = task.id;

  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.checked = !!task.completed;
  chk.addEventListener('click', (e) => {
    e.stopPropagation();
    window.todoStore.toggleComplete(task.id);
    renderTodayTasks();
    document.dispatchEvent(new CustomEvent('todo:changed'));
  });

  const content = document.createElement('div');
  content.style.flex = '1';

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;

  const desc = document.createElement('div');
  desc.className = 'task-desc';
  desc.textContent = task.description || '';

  const meta = document.createElement('div');
  meta.className = 'task-meta-info';
  meta.textContent = `${task.date} • ${task.priority}`;

  content.appendChild(title);
  if (task.description) content.appendChild(desc);
  content.appendChild(meta);

  el.appendChild(chk);
  el.appendChild(content);

  el.addEventListener('click', () => {
    // dispatch edit event consumed by addTask.js
    document.dispatchEvent(new CustomEvent('todo:edit', { detail: { task } }));
  });

  return el;
}

/* render today's tasks */
function renderTodayTasks(){
  const container = $id('todayTasks');
  const empty = $id('todayEmpty');

  if (!container) return;

  container.innerHTML = '';

  const tasks = window.todoStore.getByDate(todayISO());
  if (!tasks.length) {
    if (empty) empty.style.display = '';
    return;
  } else {
    if (empty) empty.style.display = 'none';
  }

  tasks.forEach(t => {
    container.appendChild(buildTaskElement(t));
  });
}

/* wiring nav (guarded) */
if (navToday) {
  navToday.addEventListener('click', () => {
    showView('today');
    renderTodayTasks();
  });
}
if (navCalendar) {
  navCalendar.addEventListener('click', () => {
    showView('calendar');
    document.dispatchEvent(new CustomEvent('todo:changed'));
  });
}
if (navCompleted) {
  navCompleted.addEventListener('click', () => {
    showView('completed');
    document.dispatchEvent(new CustomEvent('todo:changed'));
  });
}
if (navAdd) {
  navAdd.addEventListener('click', () => {
    // open add modal using exported helper if present
    if (typeof window.todoOpenAddModal === 'function') {
      window.todoOpenAddModal({ date: todayISO() });
    } else {
      document.dispatchEvent(new CustomEvent('todo:modalOpened', { detail: { prefill: { date: todayISO() } } }));
    }
  });
}

/* openAddModal helper - ensures modal is visible and sends modalOpened event */
function openAddModal(prefill = {}){
  const modal = $id('taskModal');
  const title = $id('taskTitle');
  const desc = $id('taskDescription');
  const date = $id('taskDate');
  const priority = $id('taskPriority');
  const modalTitle = $id('modalTitle');

  if (!modal) return;

  if (title) title.value = prefill.title || '';
  if (desc) desc.value = prefill.description || '';
  if (date) date.value = prefill.date || todayISO();
  if (priority) priority.value = prefill.priority || 'medium';
  if (modalTitle) modalTitle.textContent = prefill.id ? 'Edit Task' : 'Add Task';

  modal.style.display = 'flex';
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');

  document.dispatchEvent(new CustomEvent('todo:modalOpened', { detail: { prefill } }));
}
window.todoOpenAddModal = openAddModal;

/* cancel modal wiring */
const cancelBtn = $id('cancelBtn');
if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    const modal = $id('taskModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  });
}

/* Quick Add button — guard */
const quickAddBtn = $id('quickAddBtn');
if (quickAddBtn) {
  quickAddBtn.addEventListener('click', () => {
    if (typeof window.todoOpenAddModal === 'function') {
      window.todoOpenAddModal({ date: todayISO() });
    } else {
      document.dispatchEvent(new CustomEvent('todo:modalOpened', { detail: { prefill: { date: todayISO() } } }));
    }
  });
}

/* listen for changes to re-render today */
document.addEventListener('todo:changed', () => {
  renderTodayTasks();
});

/* initial boot */
document.addEventListener('DOMContentLoaded', () => {
  showView('today');
  renderTodayTasks();

  const dateInput = $id('taskDate');
  if (dateInput) dateInput.value = todayISO();
});
