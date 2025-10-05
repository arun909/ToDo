// viewCompleted.js
(function(){
    const container = document.getElementById('completedTasks');
  
    function render(){
      container.innerHTML = '';
      const completed = window.todoStore.getCompleted();
      if(!completed.length){
        container.innerHTML = '<p>No completed tasks yet.</p>';
        return;
      }
  
      completed.forEach(t => {
        const el = document.createElement('div');
        el.className = 'task-item';
        el.dataset.id = t.id;
  
        const content = document.createElement('div'); content.style.flex='1';
        const title = document.createElement('div'); title.className='task-title'; title.textContent = t.title;
        const meta = document.createElement('div'); meta.className='task-meta-info'; meta.textContent = `${t.date} • ${t.priority}`;
  
        content.appendChild(title);
        content.appendChild(meta);
  
        // uncomplete button
        const unBtn = document.createElement('button'); unBtn.className='btn btn-cancel'; unBtn.textContent='Undo';
        unBtn.addEventListener('click', (e)=>{
          e.stopPropagation();
          window.todoStore.toggleComplete(t.id);
          document.dispatchEvent(new CustomEvent('todo:changed'));
        });
  
        // delete button
        const delBtn = document.createElement('button'); delBtn.className='btn btn-delete'; delBtn.textContent='Delete';
        delBtn.addEventListener('click', (e)=>{
          e.stopPropagation();
          if(confirm('Delete this task permanently?')){
            window.todoStore.removeTask(t.id);
            document.dispatchEvent(new CustomEvent('todo:changed'));
          }
        });
  
        el.appendChild(content);
        el.appendChild(unBtn);
        el.appendChild(delBtn);
        container.appendChild(el);
      });
    }
  
    // re-render when tasks changed or when 'Completed' view is activated
    document.addEventListener('todo:changed', render);
  
    // ensure render on load if the page is already on completed
    document.addEventListener('DOMContentLoaded', render);
  })();
  