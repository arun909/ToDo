// addTask.js
// Handles opening the Add/Edit modal and saving/updating tasks.

(function () {
    const modal = document.getElementById('taskModal');
    const saveBtn = document.getElementById('saveTaskBtn');
    const titleInput = document.getElementById('taskTitle');
    const descInput = document.getElementById('taskDescription');
    const dateInput = document.getElementById('taskDate');
    const priorityInput = document.getElementById('taskPriority');
    const modalTitleEl = document.getElementById('modalTitle');
    const cancelBtn = document.getElementById('cancelBtn');
  
    // tracks currently editing task (null when creating new)
    let editingTask = null;
  
    // Utility: set modal fields from a task object (or defaults)
    function fillModalFields(prefill = {}) {
      titleInput.value = prefill.title || '';
      descInput.value = prefill.description || '';
      dateInput.value = prefill.date || (new Date().toISOString().split('T')[0]);
      priorityInput.value = prefill.priority || 'medium';
      modalTitleEl.textContent = prefill.id ? 'Edit Task' : 'Add Task';
      saveBtn.textContent = prefill.id ? 'Update Task' : 'Add Task';
    }
  
    // Open modal (internal helper)
    function openModal(prefill = {}) {
      fillModalFields(prefill);
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      titleInput.focus();
    }
  
    // Close modal and reset editing state
    function closeModal() {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      editingTask = null;
      fillModalFields({}); // clear inputs
    }
  
    // Listen for the global 'todo:modalOpened' event (initial.js uses this)
    // payload: { prefill } where prefill can contain { id, title, description, date, priority }
    document.addEventListener('todo:modalOpened', (e) => {
      const prefill = (e && e.detail && e.detail.prefill) ? e.detail.prefill : {};
      editingTask = prefill && prefill.id ? prefill : null;
      openModal(prefill);
    });
  
    // Also listen for explicit edit requests (when user clicks a task)
    document.addEventListener('todo:edit', (e) => {
      const task = e && e.detail && e.detail.task ? e.detail.task : null;
      if (!task) return;
      editingTask = task;
      openModal(task);
    });
  
    // Save / Update button
    saveBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      if (!title) {
        alert('Please enter a task title');
        titleInput.focus();
        return;
      }
  
      const payload = {
        title,
        description: descInput.value.trim(),
        date: dateInput.value,
        priority: priorityInput.value
      };
  
      if (editingTask && editingTask.id) {
        // update existing
        const updated = Object.assign({}, editingTask, payload);
        window.todoStore.updateTask(updated);
        editingTask = null;
      } else {
        // add new
        window.todoStore.addTask(payload);
      }
  
      // close & signal change
      closeModal();
      document.dispatchEvent(new CustomEvent('todo:changed'));
    });
  
    // Cancel behavior
    cancelBtn.addEventListener('click', () => {
      closeModal();
    });
  
    // Close modal when clicking outside content
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeModal();
    });
  
    // When an external module opens the modal and wants to prefill fields,
    // 'todo:modalOpened' will be used. If code opens via window.todoOpenAddModal(prefill)
    // that helper still works (initial.js uses it).
  
    // Expose small helper (optional): allow other code to open modal directly
    window.todoOpenAddModal = function (prefill = {}) {
      editingTask = prefill && prefill.id ? prefill : null;
      openModal(prefill);
    };
  })();
  