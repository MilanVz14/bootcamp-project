/* ================================
   TASKFLOW - app.js
   ================================ */


/* ================================
   1. SELECCIÓN DE ELEMENTOS DEL DOM
   ================================ */
/*
  El DOM es la representación del HTML en JavaScript.
  Con querySelector buscamos elementos por su id o clase,
  igual que en CSS pero para poder manipularlos con JS.
*/
const taskForm       = document.querySelector('#task-form');
const taskInput      = document.querySelector('#task-input');
const taskList       = document.querySelector('#task-list');
const emptyState     = document.querySelector('#empty-state');
const searchInput    = document.querySelector('#search-input');
const filterBtns     = document.querySelectorAll('.filter-btn');
const completeAllBtn = document.querySelector('#complete-all-btn');
const clearDoneBtn   = document.querySelector('#clear-completed-btn');
const statTotal      = document.querySelector('#stat-total');
const statCompleted  = document.querySelector('#stat-completed');
const statPending    = document.querySelector('#stat-pending');
const taskTemplate   = document.querySelector('#task-template');
const darkModeBtn    = document.querySelector('#dark-mode-btn');


/* ================================
   2. ESTADO DE LA APLICACIÓN
   ================================ */
/*
  El "estado" es la información que maneja la app en cada momento.
  - tasks: array (lista) de todas las tareas
  - filter: qué filtro está activo ('all', 'pending', 'completed')
  - searchQuery: el texto que el usuario está buscando
*/
let tasks       = [];
let filter      = 'all';
let searchQuery = '';


/* ================================
   3. ESTRUCTURA DE UNA TAREA
   ================================ */
/*
  Cada tarea es un objeto con estas propiedades:
  {
    id:        número único para identificar la tarea
    title:     texto de la tarea
    completed: true si está completada, false si no
    createdAt: fecha y hora en que se creó
  }
*/
function createTask(title) {
  return {
    id:        Date.now(),        // Date.now() devuelve un número único basado en la hora actual
    title:     title,
    completed: false,
    createdAt: new Date().toISOString()
  };
}


/* ================================
   4. LOCALSTORAGE (Persistencia)
   ================================ */
/*
  LocalStorage guarda datos en el navegador.
  Aunque cierres la pestaña, los datos siguen ahí.

  - JSON.stringify convierte el array a texto para guardarlo
  - JSON.parse convierte el texto de vuelta a array al recuperarlo
*/
function saveTasks() {
  localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem('taskflow-tasks');
  // Si no hay datos guardados, devolvemos un array vacío
  tasks = saved ? JSON.parse(saved) : [];
}


/* ================================
   5. RENDERIZADO DE TAREAS
   ================================ */
/*
  Renderizar = dibujar las tareas en la pantalla.
  Esta función limpia la lista y la vuelve a dibujar
  cada vez que algo cambia.
*/
function render() {
  // Filtramos las tareas según el filtro activo
  let visibleTasks = tasks.filter(task => {
    if (filter === 'pending')   return !task.completed;
    if (filter === 'completed') return task.completed;
    return true; // 'all' muestra todas
  });

  // Filtramos también por el texto de búsqueda
  if (searchQuery) {
    visibleTasks = visibleTasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Vaciamos la lista antes de redibujarla
  taskList.innerHTML = '';

  // Si no hay tareas visibles, mostramos el mensaje de "vacío"
  if (visibleTasks.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;

    // Por cada tarea, creamos una tarjeta y la añadimos a la lista
    visibleTasks.forEach(task => {
      const card = createTaskCard(task);
      taskList.appendChild(card);
    });
  }

  // Actualizamos las estadísticas
  updateStats();
}


/* ================================
   6. CREAR TARJETA DE TAREA
   ================================ */
/*
  Usamos el <template> del HTML como base.
  Clonamos la plantilla, rellenamos los datos
  y añadimos los eventos de cada botón.
*/
function createTaskCard(task) {
  // Clonamos la plantilla (el true hace una copia completa)
  const clone = taskTemplate.content.cloneNode(true);
  const li    = clone.querySelector('.task-item');

  const checkbox  = clone.querySelector('.task-checkbox');
  const titleSpan = clone.querySelector('.task-title');
  const editBtn   = clone.querySelector('.task-edit-btn');
  const deleteBtn = clone.querySelector('.task-delete-btn');

  // Rellenamos los datos de la tarea
  titleSpan.textContent   = task.title;
  checkbox.checked        = task.completed;
  li.dataset.id           = task.id; // Guardamos el id en el elemento HTML

  // Si está completada, añadimos la clase visual
  if (task.completed) {
    li.classList.add('task-item--completed');
  }

  // Evento: marcar/desmarcar como completada
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Evento: editar la tarea
  editBtn.addEventListener('click', () => editTask(task.id));

  // Evento: eliminar la tarea
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  return clone;
}


/* ================================
   7. ESTADÍSTICAS
   ================================ */
function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending   = total - completed;

  statTotal.textContent     = total;
  statCompleted.textContent = completed;
  statPending.textContent   = pending;
}


/* ================================
   8. ACCIONES SOBRE TAREAS
   ================================ */

// AÑADIR tarea
function addTask(title) {
  const task = createTask(title);
  tasks.push(task); // push añade un elemento al final del array
  saveTasks();
  render();
}

// MARCAR/DESMARCAR como completada
function toggleTask(id) {
  // Buscamos la tarea por su id y cambiamos su estado
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed; // ! invierte el valor (true → false, false → true)
    saveTasks();
    render();
  }
}

// ELIMINAR tarea
function deleteTask(id) {
  // filter crea un nuevo array sin la tarea que queremos borrar
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

// EDITAR tarea
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  // prompt abre una ventana del navegador para escribir texto
  const newTitle = prompt('Edita el título de la tarea:', task.title);

  // Si el usuario cancela o deja el campo vacío, no hacemos nada
  if (newTitle === null || newTitle.trim() === '') return;

  task.title = newTitle.trim();
  saveTasks();
  render();
}

// MARCAR TODAS como completadas
function completeAll() {
  tasks.forEach(task => task.completed = true);
  saveTasks();
  render();
}

// BORRAR todas las completadas
function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
}


/* ================================
   9. EVENTOS
   ================================ */
/*
  Los eventos son "escuchadores" que esperan a que el usuario
  haga algo (enviar formulario, hacer clic, escribir...)
  y ejecutan una función cuando ocurre.
*/

// Envío del formulario para añadir tarea
taskForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Evita que la página se recargue al enviar el formulario

  const title = taskInput.value.trim(); // trim() elimina espacios al inicio y al final
  if (title === '') return; // Si está vacío, no hacemos nada

  addTask(title);
  taskInput.value = ''; // Limpiamos el input después de añadir
  taskInput.focus();    // Devolvemos el foco al input para seguir añadiendo
});

// Búsqueda en tiempo real
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
});

// Filtros
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Quitamos la clase activa de todos los botones
    filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
    // Se la añadimos solo al que se ha pulsado
    btn.classList.add('filter-btn--active');
    filter = btn.dataset.filter;
    render();
  });
});

// Marcar todas completadas
completeAllBtn.addEventListener('click', completeAll);

// Borrar completadas
clearDoneBtn.addEventListener('click', clearCompleted);


/* ================================
   10. MODO OSCURO
   ================================ */
/*
  Añadimos o quitamos la clase 'dark' del body.
  También lo guardamos en LocalStorage para que
  se recuerde aunque el usuario cierre la página.
*/
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  darkModeBtn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('taskflow-dark', isDark);
}

function loadDarkMode() {
  const isDark = localStorage.getItem('taskflow-dark') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
    darkModeBtn.textContent = '☀️';
  }
}

darkModeBtn.addEventListener('click', toggleDarkMode);


/* ================================
   11. INICIO DE LA APP
   ================================ */
/*
  Cuando se carga la página:
  1. Cargamos las tareas guardadas en LocalStorage
  2. Renderizamos la lista
*/
loadTasks();
loadDarkMode();
render();
