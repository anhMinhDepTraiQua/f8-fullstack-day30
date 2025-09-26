// app.js - Todo App using Axios and JSON Server
// CONFIG
const API_BASE = 'http://localhost:3000'; // khi deploy, đổi thành URL JSON Server nếu cần (hoặc dùng CORS proxy)
const TODOS_ENDPOINT = `${API_BASE}/todos`;

// SELECTORS (thay thế bằng selector trong template nếu khác)
const todoListEl = document.querySelector('.todo-list') || document.getElementById('todo-list');
const formEl = document.querySelector('.todo-form') || document.getElementById('todo-form');
const inputEl = document.querySelector('.todo-input') || document.getElementById('todo-input');
const loadingEl = createLoadingEl();
const messageEl = createMessageEl();

// initial setup
document.body.appendChild(loadingEl);
document.body.appendChild(messageEl);

let editingId = null;

// Utils
function createLoadingEl() {
  const el = document.createElement('div');
  el.className = 'app-loading';
  el.style.position = 'fixed';
  el.style.left = '0';
  el.style.top = '0';
  el.style.right = '0';
  el.style.bottom = '0';
  el.style.display = 'none';
  el.style.justifyContent = 'center';
  el.style.alignItems = 'center';
  el.style.background = 'rgba(0,0,0,0.2)';
  el.innerHTML = `<div style="padding:12px 18px;border-radius:8px;background:white;box-shadow:0 4px 12px rgba(0,0,0,0.15)">Loading...</div>`;
  return el;
}

function createMessageEl() {
  const el = document.createElement('div');
  el.className = 'app-message';
  el.style.position = 'fixed';
  el.style.right = '16px';
  el.style.top = '16px';
  el.style.zIndex = '9999';
  el.style.display = 'none';
  el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
  el.style.background = '#f8d7da';
  el.style.color = '#842029';
  return el;
}

function showLoading(show=true) {
  loadingEl.style.display = show ? 'flex' : 'none';
}

function showMessage(text, duration=3500) {
  messageEl.textContent = text;
  messageEl.style.display = 'block';
  setTimeout(()=> messageEl.style.display = 'none', duration);
}

function handleAxiosError(err) {
  if (err.response) {
    // server responded with status
    return `Lỗi server: ${err.response.status} ${err.response.statusText}`;
  } else if (err.request) {
    return 'Không nhận được phản hồi từ server. Kiểm tra JSON Server/CORS.';
  } else {
    return `Lỗi: ${err.message}`;
  }
}

// API calls
async function fetchTodos() {
  showLoading(true);
  try {
    const res = await axios.get(TODOS_ENDPOINT);
    return res.data;
  } catch (err) {
    showMessage(handleAxiosError(err));
    return [];
  } finally {
    showLoading(false);
  }
}

async function createTodoApi(title) {
  showLoading(true);
  try {
    const payload = { title, completed: false, createdAt: new Date().toISOString() };
    const res = await axios.post(TODOS_ENDPOINT, payload);
    return res.data;
  } catch (err) {
    showMessage(handleAxiosError(err));
    throw err;
  } finally {
    showLoading(false);
  }
}

async function patchTodoApi(id, patch) {
  showLoading(true);
  try {
    const res = await axios.patch(`${TODOS_ENDPOINT}/${id}`, patch);
    return res.data;
  } catch (err) {
    showMessage(handleAxiosError(err));
    throw err;
  } finally {
    showLoading(false);
  }
}

async function deleteTodoApi(id) {
  showLoading(true);
  try {
    const res = await axios.delete(`${TODOS_ENDPOINT}/${id}`);
    return res.data;
  } catch (err) {
    showMessage(handleAxiosError(err));
    throw err;
  } finally {
    showLoading(false);
  }
}

// RENDER
function renderTodos(todos) {
  if (!todoListEl) return;
  todoListEl.innerHTML = '';

  if (!todos.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Chưa có todo nào. Thêm việc mới nhé!';
    todoListEl.appendChild(empty);
    return;
  }

  todos.forEach(todo => {
    const item = document.createElement('li');
    item.className = 'todo-item';
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!todo.completed;
    checkbox.className = 'todo-checkbox';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'todo-title-wrap';
    const title = document.createElement('span');
    title.className = 'todo-title';
    title.textContent = todo.title;
    if (todo.completed) title.style.textDecoration = 'line-through';
    titleWrap.appendChild(title);

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Edit';

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = 'Delete';

    item.appendChild(checkbox);
    item.appendChild(titleWrap);
    item.appendChild(editBtn);
    item.appendChild(delBtn);

    // events
    checkbox.addEventListener('change', async () => {
      try {
        await patchTodoApi(todo.id, { completed: checkbox.checked });
        title.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
      } catch (e) {
        checkbox.checked = !checkbox.checked; // revert
      }
    });

    editBtn.addEventListener('click', () => startInlineEdit(todo, titleWrap, title));

    delBtn.addEventListener('click', async () => {
      const ok = confirm('Bạn có chắc muốn xóa todo này?');
      if (!ok) return;
      try {
        await deleteTodoApi(todo.id);
        // re-render list
        await loadAndRender();
      } catch (e) {
        // error message already shown in API fn
      }
    });

    todoListEl.appendChild(item);
  });
}

// Inline edit
function startInlineEdit(todo, titleWrap, titleEl) {
  if (editingId !== null) return showMessage('Đang sửa todo khác. Lưu / hủy trước khi chỉnh cái này.');
  editingId = todo.id;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = todo.title;
  input.className = 'todo-edit-input';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.className = 'btn-save';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'btn-cancel';

  titleWrap.innerHTML = '';
  titleWrap.appendChild(input);
  titleWrap.appendChild(saveBtn);
  titleWrap.appendChild(cancelBtn);

  input.focus();
  input.select();

  saveBtn.addEventListener('click', async () => {
    const newText = input.value.trim();
    if (!newText) return showMessage('Nội dung không được để trống.');
    try {
      await patchTodoApi(todo.id, { title: newText });
      editingId = null;
      await loadAndRender();
    } catch (e) {
      // error shown already
    }
  });

  cancelBtn.addEventListener('click', () => {
    editingId = null;
    titleWrap.innerHTML = '';
    const t = document.createElement('span');
    t.className = 'todo-title';
    t.textContent = todo.title;
    titleWrap.appendChild(t);
  });
}

// Form handling
if (formEl && inputEl) {
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) {
      showMessage('Không được để trống todo.');
      return;
    }
    try {
      await createTodoApi(text);
      inputEl.value = '';
      await loadAndRender();
    } catch (err) {
      // shown in API fn
    }
  });
}

// load + render helper
async function loadAndRender() {
  const todos = await fetchTodos();
  renderTodos(todos);
}

// init
loadAndRender();
