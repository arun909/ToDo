// viewByDate.js
(function(){
    const calendarEl = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('currentMonth');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const selectedPanel = document.getElementById('selectedDateTasks');
  
    let currentMonth = new Date(); // first day of month will be used
    let selectedDate = null;
  
    /* utils */
    function iso(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0]; }
    function formatMonth(d){ return d.toLocaleDateString('en-US',{ month:'long', year:'numeric' }); }
  
    function renderCalendar(){
      currentMonthEl.textContent = formatMonth(currentMonth);
      calendarEl.innerHTML = '';
  
      // weekday headers
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      days.forEach(h => {
        const hd = document.createElement('div');
        hd.className = 'calendar-day calendar-day-header';
        hd.textContent = h;
        calendarEl.appendChild(hd);
      });
  
      const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const last = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 0);
  
      // start offset (days from previous month)
      const startOffset = first.getDay();
      for(let i=0;i<startOffset;i++){
        const blank = document.createElement('div');
        blank.className = 'calendar-day other-month';
        calendarEl.appendChild(blank);
      }
  
      // render days
      const allTasks = window.todoStore.getAll();
      for(let d=1; d<=last.getDate(); d++){
        const day = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
        const dayISO = iso(day);
  
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = d;
        dayEl.dataset.date = dayISO;
  
        // today
        const today = new Date(); if(iso(today) === dayISO) dayEl.classList.add('today');
  
        // has tasks indicator
        if(allTasks.some(t => t.date === dayISO)) dayEl.classList.add('has-tasks');
  
        // selected
        if(selectedDate === dayISO) dayEl.classList.add('selected');
  
        dayEl.addEventListener('click', () => {
          selectedDate = dayISO;
          renderCalendar(); // update selected style
          renderSelectedDateTasks(dayISO);
          // also switch to calendar view if not already visible
          document.getElementById('pageTitle').textContent = 'Calendar';
        });
  
        calendarEl.appendChild(dayEl);
      }
    }
  
    function renderSelectedDateTasks(dateISO){
      selectedPanel.innerHTML = '';
      const heading = document.createElement('h3');
      heading.textContent = humanDateLabel(dateISO);
      selectedPanel.appendChild(heading);
  
      const tasks = window.todoStore.getByDate(dateISO);
      if(!tasks.length){
        const p = document.createElement('p'); p.textContent = 'No tasks for this date.'; p.className='no-tasks';
        selectedPanel.appendChild(p);
        return;
      }
  
      tasks.forEach(t => {
        const el = document.createElement('div');
        el.className = 'task-item';
        el.dataset.id = t.id;
  
        const chk = document.createElement('input'); chk.type='checkbox'; chk.checked = !!t.completed;
        chk.addEventListener('click', (e)=>{ e.stopPropagation(); window.todoStore.toggleComplete(t.id); document.dispatchEvent(new CustomEvent('todo:changed')); });
  
        const content = document.createElement('div'); content.style.flex='1';
        const title = document.createElement('div'); title.className='task-title'; title.textContent = t.title;
        const desc = document.createElement('div'); desc.className='task-desc'; desc.textContent = t.description || '';
        const meta = document.createElement('div'); meta.className='task-meta-info'; meta.textContent = `${t.date} • ${t.priority}`;
  
        content.appendChild(title);
        if(t.description) content.appendChild(desc);
        content.appendChild(meta);
  
        // click to edit
        el.addEventListener('click', ()=> document.dispatchEvent(new CustomEvent('todo:edit', { detail:{task:t} })));
  
        el.appendChild(chk); el.appendChild(content);
        selectedPanel.appendChild(el);
      });
    }
  
    function humanDateLabel(isoStr){
      const d = new Date(isoStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    }
  
    prevBtn.addEventListener('click', ()=>{ currentMonth.setMonth(currentMonth.getMonth()-1); renderCalendar(); });
    nextBtn.addEventListener('click', ()=>{ currentMonth.setMonth(currentMonth.getMonth()+1); renderCalendar(); });
  
    // re-render when tasks change (e.g., added/toggled)
    document.addEventListener('todo:changed', ()=> renderCalendar());
  
    // when page loads, if calendar view is shown the module will render on demand.
    document.addEventListener('DOMContentLoaded', ()=> {
      renderCalendar();
    });
  })();
  