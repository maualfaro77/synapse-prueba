(function(){
  // frontend compatible con Cordova: escucha deviceready; si no existe, usa DOMContentLoaded
  const start = () => {
    const api = {
      listSchedules: () => fetch('/api/schedules').then(r => r.json()),
      createSchedule: (body) => fetch('/api/schedules',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()),
      addBlock: (id, body) => fetch(`/api/schedules/${id}/blocks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()),
      current: (id) => fetch(`/api/schedules/${id}/current`).then(r=>r.json())
    }
    const $ = sel => document.querySelector(sel)
  const schedulesSelect = $('#schedules-select')
  const modulesDiv = $('#modules')
  const noActivity = $('#no-activity')
  const btnRefresh = $('#btn-refresh')
  const formCreateSchedule = document.getElementById('form-create-schedule')
  const scheduleItemsDiv = document.getElementById('schedule-items')
    // paleta de colores para tiles (rotativa)
    const palette = ['schedule-tile-blue','schedule-tile-pink','schedule-tile-deep','schedule-tile-teal']

    async function loadSchedules(){
      schedulesSelect.innerHTML = '<option value="">— Selecciona un horario —</option>'
      try{
        const res = await api.listSchedules()
        const list = res.schedules || []
        scheduleItemsDiv.innerHTML = ''
        for(const [i,s] of list.entries()){
          const opt = document.createElement('option')
          opt.value = s._id
          opt.textContent = s.name + (s.user?` (${s.user})`: '')
          schedulesSelect.appendChild(opt)

          const item = document.createElement('div')
          item.className = 'schedule-item ' + (palette[i % palette.length])
          item.dataset.id = s._id
          item.textContent = s.name + (s.user? ` — ${s.user}` : '')
          item.addEventListener('click', ()=>{
            schedulesSelect.value = s._id
            document.querySelectorAll('.schedule-item').forEach(e=>e.classList.remove('active'))
            item.classList.add('active')
            refreshView()
            schedulesSelect.dispatchEvent(new Event('change'))
          })
          scheduleItemsDiv.appendChild(item)
        }
      }catch(e){ console.error(e); $('#server-status').textContent='Error' }
    }

    async function refreshView(){
      const id = schedulesSelect.value
      modulesDiv.innerHTML = ''
      noActivity.style.display = 'block'
      if(!id) return
      try{
        const res = await api.current(id)
        if(res.message){ // no activities or error
          noActivity.textContent = res.message
          return
        }
        noActivity.style.display = 'none'
        const { previous, current, next } = res
        const items = [ {label:'Anterior', data:previous}, {label:'Actual', data:current}, {label:'Siguiente', data:next} ]
        for(const it of items){
          const div = document.createElement('div')
          // asignar clase según tipo
          if(it.label==='Anterior') div.className = 'module module-prev'
          else if(it.label==='Actual') div.className = 'module module-current'
          else div.className = 'module module-next'
          const title = document.createElement('h3')
          title.textContent = it.label
          div.appendChild(title)
          if(!it.data){
            const p = document.createElement('div')
            p.textContent = '—'
            div.appendChild(p)
          }else{
            const t = document.createElement('div')
            t.className = 'time'
            t.textContent = `${it.data.start} — ${it.data.end}`
            div.appendChild(t)
            if(it.data.title){
              const subj = document.createElement('div')
              subj.textContent = it.data.title
              div.appendChild(subj)
            }
            if(it.data.tag && it.data.tag.name){
              const tag = document.createElement('span')
              tag.className = 'tag'
              tag.textContent = it.data.tag.name
              div.appendChild(tag)
            }
          }
          modulesDiv.appendChild(div)
        }
      }catch(e){ console.error(e); noActivity.textContent = 'Error al consultar la API' }
    }

    btnRefresh.addEventListener('click', refreshView)

    schedulesSelect.addEventListener('change', refreshView)

    // exponer loadSchedules y refreshView a otras secciones
    window.loadSchedules = loadSchedules
    window.refreshView = refreshView

    // crear horarios reales via sidebar form
    formCreateSchedule.addEventListener('submit', async (ev)=>{
      ev.preventDefault()
      const name = document.getElementById('schedule-name').value.trim()
      const user = document.getElementById('schedule-user').value.trim()
      if(!name){ alert('Nombre del horario es requerido'); return }
      const btn = document.getElementById('btn-create-schedule')
      btn.disabled = true
      try{
        const res = await api.createSchedule({ name, user: user || undefined })
        await loadSchedules()
        if(res && res.schedule && res.schedule._id){
          schedulesSelect.value = res.schedule._id
          document.querySelectorAll('.schedule-item').forEach(e=>e.classList.remove('active'))
          const newly = document.querySelector(`.schedule-item[data-id='${res.schedule._id}']`)
          if(newly) newly.classList.add('active')
          refreshView()
          schedulesSelect.dispatchEvent(new Event('change'))
        }
  if(window.showToast) window.showToast('Horario creado','success') ; else alert('Horario creado')
      }catch(e){ console.error(e); alert('Error al crear horario') }
      btn.disabled = false
    })

    // carga inicial
    loadSchedules()

    // refrescar cada 30s si hay selección
    setInterval(()=>{ if(schedulesSelect.value) refreshView() }, 30000)

    // si la página recibe ?schedule=<id> en la URL, seleccionarlo
    const params = new URLSearchParams(location.search)
    if(params.get('schedule')){
      (async ()=>{ await loadSchedules(); schedulesSelect.value = params.get('schedule'); refreshView() })()
    }
  }

  if (window.cordova) {
    document.addEventListener('deviceready', start, false)
  } else {
    document.addEventListener('DOMContentLoaded', start)
  }
})();

// sidebar toggle para mobile con focus-trap y Escape para cerrar
(function(){
  const btn = document.getElementById('sidebar-toggle')
  const sidebar = document.querySelector('.sidebar')
  const overlay = document.getElementById('sidebar-overlay')
  if(!btn || !sidebar) return
  let previouslyFocused = null

  function getFocusable(container){
    return Array.from(container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])')).filter(el=>!el.disabled && el.offsetParent!==null)
  }

  function trapFocus(e){
    if(e.key !== 'Tab') return
    const focusables = getFocusable(sidebar)
    if(!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length -1]
    if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus() } }
    else { if(document.activeElement === last){ e.preventDefault(); first.focus() } }
  }

  function onKeyDown(e){
    if(e.key === 'Escape') { close(); return }
    trapFocus(e)
  }

  function open(){
    previouslyFocused = document.activeElement
    sidebar.classList.add('open')
    if(overlay) overlay.classList.add('visible')
    sidebar.setAttribute('aria-hidden','false')
    overlay && overlay.setAttribute('aria-hidden','false')
    document.addEventListener('keydown', onKeyDown)
    // focus first focusable
    setTimeout(()=>{ const f = getFocusable(sidebar)[0]; if(f) f.focus(); }, 60)
  }

  function close(){
    sidebar.classList.remove('open')
    if(overlay) overlay.classList.remove('visible')
    sidebar.setAttribute('aria-hidden','true')
    overlay && overlay.setAttribute('aria-hidden','true')
    document.removeEventListener('keydown', onKeyDown)
    if(previouslyFocused && previouslyFocused.focus) previouslyFocused.focus()
  }

  btn.addEventListener('click', ()=>{ if(sidebar.classList.contains('open')) close(); else open() })
  if(overlay) overlay.addEventListener('click', close)
  // cerrar sidebar al seleccionar un horario en mobile
  document.addEventListener('click', (ev)=>{
    const it = ev.target.closest && ev.target.closest('.schedule-item')
    if(it && window.innerWidth <= 900){ setTimeout(()=> close(), 250) }
  })
})();

// --- Gestión de bloques y tags ---
(function(){
  // helpers para llamadas que necesitan status
  async function fetchWithStatus(url, opts){
    const r = await fetch(url, opts)
    let body = null
    try{ body = await r.json() }catch(e){ body = null }
    return { status: r.status, body }
  }

  const schedulesSelect = document.getElementById('schedules-select')
  const blocksList = document.getElementById('blocks-list')
  const btnAddBlock = document.getElementById('btn-add-block')
  const formAddBlock = document.getElementById('form-add-block')
  const blockDay = document.getElementById('block-day')
  const blockStart = document.getElementById('block-start')
  const blockEnd = document.getElementById('block-end')
  const blockTitle = document.getElementById('block-title')
  const blockTag = document.getElementById('block-tag')
  const blockIdInput = document.getElementById('block-id')
  const btnCancelEdit = document.getElementById('btn-cancel-edit')

  const tagsListDiv = document.getElementById('tags-list')
  const btnAddTag = document.getElementById('btn-add-tag')
  const formAddTag = document.getElementById('form-add-tag')
  const tagName = document.getElementById('tag-name')
  const tagColor = document.getElementById('tag-color')

  async function loadTags(){
    try{
      const r = await fetch('/api/tags')
      const data = await r.json()
      const tags = data.tags || []
      tagsListDiv.innerHTML = ''
      blockTag.innerHTML = '<option value="">— Sin tag —</option>'
      for(const t of tags){
        const div = document.createElement('div')
        div.textContent = t.name + (t.color?` (${t.color})`: '')
        tagsListDiv.appendChild(div)
        const opt = document.createElement('option')
        opt.value = t._id
        opt.textContent = t.name
        blockTag.appendChild(opt)
      }
    }catch(e){ console.error(e) }
  }

  // Toast helper with show animation and swipe-to-dismiss (mobile)
  function showToast(message, type='info', timeout=4000){
    const container = document.getElementById('toast-container')
    if(!container) return
    const t = document.createElement('div')
    t.className = 'toast toast--' + (type||'info')
    t.innerHTML = `<span>${message}</span><button class="toast-close" aria-label="close">×</button>`
    container.appendChild(t)

    // animate in
    requestAnimationFrame(()=> t.classList.add('show'))

    const closeBtn = t.querySelector('.toast-close')
    function removeToast(){
      t.classList.add('removing')
      setTimeout(()=> t.remove(), 220)
    }

    closeBtn.addEventListener('click', removeToast)

    // swipe-to-dismiss (touch)
    let startX = 0, currentX = 0, dragging = false
    function onTouchStart(e){
      dragging = true
      startX = (e.touches && e.touches[0] && e.touches[0].clientX) || 0
      t.style.transition = 'none'
    }
    function onTouchMove(e){
      if(!dragging) return
      currentX = (e.touches && e.touches[0] && e.touches[0].clientX) || 0
      const dx = currentX - startX
      t.style.transform = `translateX(${Math.max(0, dx)}px)`
      t.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / 180))
    }
    function onTouchEnd(){
      dragging = false
      const dx = currentX - startX
      t.style.transition = ''
      t.style.transform = ''
      t.style.opacity = ''
      if(Math.abs(dx) > 80){ removeToast() }
    }
    t.addEventListener('touchstart', onTouchStart, {passive:true})
    t.addEventListener('touchmove', onTouchMove, {passive:true})
    t.addEventListener('touchend', onTouchEnd)

    // auto-remove
    if(timeout>0){
      const to = setTimeout(()=> removeToast(), timeout)
      // clear timer if user interacts
      t.addEventListener('mouseenter', ()=> clearTimeout(to))
    }
  }

  // Exponer showToast globalmente para que otros scripts puedan usarlo
  window.showToast = showToast

  function setFieldError(field, message){
    if(!field) return
    let err = field.parentNode.querySelector('.field-error')
    if(!err){ err = document.createElement('div'); err.className='field-error'; field.parentNode.appendChild(err) }
    err.textContent = message || ''
  }

  function clearFieldErrors(){
    document.querySelectorAll('.field-error').forEach(e=>e.remove())
  }

  function validateHHMM(v){
    if(!v) return false
    const m = v.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
    return !!m
  }

  async function loadScheduleDetails(){
    const id = schedulesSelect.value
    blocksList.innerHTML = ''
    if(!id) return
    try{
      const r = await fetch(`/api/schedules/${id}`)
      const data = await r.json()
      const schedule = data.schedule
      if(!schedule) return
      // mostrar bloques
      const blocks = schedule.blocks || []
      for(const b of blocks){
        const item = document.createElement('div')
        item.className = 'block-item'
        const info = document.createElement('div')
        info.className = 'block-info'
        info.textContent = `${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][b.day]} ${b.start}–${b.end} ${b.title?'- '+b.title:''}`
        const actions = document.createElement('div')
        actions.className = 'block-actions'
        const btnDel = document.createElement('button')
        btnDel.textContent = 'Eliminar'
        btnDel.className = 'btn-small'
        btnDel.addEventListener('click', async ()=>{
          if(!confirm('Eliminar bloque?')) return
          const res = await fetchWithStatus(`/api/schedules/${id}/blocks/${b._id}`,{ method: 'DELETE' })
          if(res.status===200){ await loadScheduleDetails(); loadSchedules(); } else { alert('Error al eliminar') }
        })
        const btnEdit = document.createElement('button')
        btnEdit.textContent = 'Editar'
        btnEdit.className = 'btn-small'
        btnEdit.addEventListener('click', ()=>{
          // entrar en modo edición
          blockIdInput.value = b._id
          blockDay.value = b.day
          blockStart.value = b.start
          blockEnd.value = b.end
          blockTitle.value = b.title || ''
          blockTag.value = b.tag? b.tag._id : ''
          // mostrar botón cancelar y cambiar texto del submit
          btnAddBlock.textContent = 'Guardar'
          btnCancelEdit.style.display = 'inline-block'
        })
        actions.appendChild(btnEdit)
        actions.appendChild(btnDel)
        item.appendChild(info)
        item.appendChild(actions)
        blocksList.appendChild(item)
      }
    }catch(e){ console.error(e) }
  }

  formAddBlock.addEventListener('submit', async (ev)=>{
    ev.preventDefault()
    const id = schedulesSelect.value
    if(!id){ alert('Selecciona un horario'); return }
    clearFieldErrors()
    const editingId = blockIdInput.value && blockIdInput.value.trim()
    // validaciones cliente
    if(!validateHHMM(blockStart.value)){ setFieldError(blockStart, 'Formato HH:mm inválido'); return }
    if(!validateHHMM(blockEnd.value)){ setFieldError(blockEnd, 'Formato HH:mm inválido'); return }
    if(blockStart.value === blockEnd.value){ setFieldError(blockEnd, 'Inicio y fin no pueden ser iguales'); return }
    const body = { day: parseInt(blockDay.value,10), start: blockStart.value, end: blockEnd.value, title: blockTitle.value }
    if(blockTag.value) body.tag = blockTag.value
    // deshabilitar botones
    btnAddBlock.disabled = true
    btnCancelEdit.disabled = true
    if(editingId){
      // PUT
      const res = await fetchWithStatus(`/api/schedules/${id}/blocks/${editingId}`,{ method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
      if(res.status===200){ await loadScheduleDetails(); await loadSchedules(); formAddBlock.reset(); loadTags(); clearEditMode(); showToast('Bloque actualizado', 'success') } else if(res.status===409){ showToast((res.body?.message || 'Conflicto') + ': ' + (res.body?.conflictingBlocks||[]).map(c=>`${c.start}-${c.end}`).join(', '), 'error', 6000) } else { showToast(res.body?.message || 'Error', 'error') }
    }else{
      // POST
      const res = await fetchWithStatus(`/api/schedules/${id}/blocks`,{ method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
      if(res.status===201){ await loadScheduleDetails(); await loadSchedules(); formAddBlock.reset(); loadTags(); showToast('Bloque agregado', 'success') } else if(res.status===409){ showToast((res.body?.message || 'Conflicto') + ': ' + (res.body?.conflictingBlocks||[]).map(c=>`${c.start}-${c.end}`).join(', '), 'error', 6000) } else { showToast(res.body?.message || 'Error', 'error') }
    }
    btnAddBlock.disabled = false
    btnCancelEdit.disabled = false
  })

  function clearEditMode(){
    blockIdInput.value = ''
    btnAddBlock.textContent = 'Agregar'
    btnCancelEdit.style.display = 'none'
  }

  btnCancelEdit.addEventListener('click', ()=>{ formAddBlock.reset(); clearEditMode() })

  formAddTag.addEventListener('submit', async (ev)=>{
    ev.preventDefault()
    const name = tagName.value.trim()
    if(!name) return alert('Nombre requerido')
    const color = tagColor.value.trim() || undefined
    // cliente: validar nombre
    if(!name){ setFieldError(tagName, 'Nombre requerido'); return }
    btnAddTag.disabled = true
    const res = await fetchWithStatus('/api/tags',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, color }) })
    if(res.status===201){ tagName.value=''; tagColor.value=''; await loadTags(); showToast('Tag creado', 'success') } else { showToast('Error creando tag', 'error') }
    btnAddTag.disabled = false
  })

  // actualizar carga cuando se selecciona schedule
  schedulesSelect.addEventListener('change', ()=>{ loadScheduleDetails(); loadTags(); })

  // carga inicial
  loadTags()
})();
