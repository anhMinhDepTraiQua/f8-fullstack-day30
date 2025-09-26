const API_URL = "http://localhost:3000/todos";

const taskList = document.querySelector("#task-list");
const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");

// Escape HTML để ngăn XSS
function escapeHTML(html) {
    const div = document.createElement("div");
    div.innerText = html;
    return div.innerHTML;
}

// --- Lấy todos từ server ---
async function fetchTasks() {
    try {
        const res = await axios.get(API_URL);
        renderTasks(res.data);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

// --- Render danh sách ---
function renderTasks(tasks) {
    if (!tasks.length) {
        taskList.innerHTML =
            '<li class="empty-message">No tasks available.</li>';
        return;
    }

    const html = tasks
        .map(
            (task) => `
    <li class="task-item ${task.completed ? "completed" : ""}" data-id="${task.id}">
        <span class="task-title">${escapeHTML(task.title)}</span>
        <div class="task-action">
            <button class="task-btn edit">Edit</button>
            <button class="task-btn done">${
                task.completed ? "Mark as undone" : "Mark as done"
            }</button>
            <button class="task-btn delete">Delete</button>
        </div>
    </li>
    `
        )
        .join("");

    taskList.innerHTML = html;
}

// --- Thêm công việc ---
async function addTask(e) {
    e.preventDefault();
    const value = todoInput.value.trim();
    if (!value) return alert("Please write something!");

    const newTask = {
        title: value,
        completed: false,
        createdAt: new Date().toISOString(),
    };

    try {
        await axios.post(API_URL, newTask, {
            headers: { "Content-Type": "application/json" },
        });
        todoInput.value = "";
        fetchTasks();
    } catch (err) {
        console.error("Add failed:", err);
    }
}

// --- Xử lý hành động Edit / Done / Delete ---
taskList.addEventListener("click", async (e) => {
    const li = e.target.closest(".task-item");
    if (!li) return;
    const id = li.dataset.id;

    // Edit
    if (e.target.closest(".edit")) {
        let newTitle = prompt(
            "Enter the new task title:",
            li.querySelector(".task-title").innerText
        );
        if (newTitle === null) return;
        newTitle = newTitle.trim();
        if (!newTitle) return alert("Task title cannot be empty!");

        try {
            await axios.patch(`${API_URL}/${id}`, { title: newTitle });
            fetchTasks();
        } catch (err) {
            console.error("Edit failed:", err);
        }
    }

    // Done/Undone
    if (e.target.closest(".done")) {
        const completed = !li.classList.contains("completed");
        try {
            await axios.patch(`${API_URL}/${id}`, { completed });
            fetchTasks();
        } catch (err) {
            console.error("Toggle failed:", err);
        }
    }

    // Delete
    if (e.target.closest(".delete")) {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchTasks();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }
});

// --- Khởi động ---
todoForm.addEventListener("submit", addTask);
fetchTasks();
