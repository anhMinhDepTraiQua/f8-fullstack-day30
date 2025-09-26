// Lấy danh sách công việc từ localStorage (nếu không có thì khởi tạo mảng rỗng)
const tasks = JSON.parse(localStorage.getItem("tasks")) ?? [];

// Truy cập vào các phần tử trong DOM
const taskList = document.querySelector("#task-list"); // Danh sách công việc
const todoForm = document.querySelector("#todo-form"); // Form thêm công việc
const todoInput = document.querySelector("#todo-input"); // Input để nhập tên công việc

// Hàm để escape HTML nhằm ngăn ngừa XSS
function escapeHTML(html) {
    const div = document.createElement("div");
    div.innerText = html; // Gán nội dung vào thẻ div để tự động escape các ký tự HTML
    return div.innerHTML; // Trả về nội dung đã được escape
}

// Kiểm tra xem tiêu đề công việc mới có bị trùng lặp không
function isDuplicateTask(newTitle, excludeIndex = -1) {
    const isDuplicate = tasks.some(
        (task, index) =>
            task.title.toLowerCase() === newTitle.toLowerCase() && // So sánh không phân biệt chữ hoa/thường
            excludeIndex !== index // Loại trừ công việc đang chỉnh sửa
    );
    return isDuplicate; // Trả về true nếu trùng, false nếu không
}

// Lưu danh sách công việc vào localStorage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks)); // Chuyển mảng tasks thành chuỗi JSON và lưu
}

// Xử lý các hành động trên công việc (sửa, đánh dấu hoàn thành, xóa)
function handleTaskActions(e) {
    const taskItem = e.target.closest(".task-item"); // Tìm công việc tương ứng với nút được bấm
    if (!taskItem) return;

    const taskIndex = +taskItem.dataset.index; // Lấy chỉ mục của công việc
    const task = tasks[taskIndex]; // Lấy công việc từ danh sách

    // Sửa tiêu đề công việc
    if (e.target.closest(".edit")) {
        let newTitle = prompt("Enter the new task title:", task.title); // Hỏi người dùng tiêu đề mới

        if (newTitle === null) return; // Hủy nếu người dùng bấm Cancel

        newTitle = newTitle.trim(); // Xóa khoảng trắng thừa

        if (!newTitle) {
            alert("Task title cannot be empty!"); // Cảnh báo nếu tiêu đề rỗng
            return;
        }

        if (isDuplicateTask(newTitle, taskIndex)) {
            alert(
                "Task with this title already exists! Please use a different task title!"
            ); // Cảnh báo nếu tiêu đề trùng lặp
            return;
        }

        task.title = newTitle; // Cập nhật tiêu đề công việc
        renderTasks(); // Hiển thị lại danh sách công việc
        saveTasks(); // Lưu danh sách vào localStorage
        return;
    }

    // Đánh dấu hoàn thành hoặc chưa hoàn thành
    if (e.target.closest(".done")) {
        task.completed = !task.completed; // Đảo trạng thái hoàn thành
        renderTasks(); // Hiển thị lại danh sách công việc
        saveTasks(); // Lưu danh sách vào localStorage
        return;
    }

    // Xóa công việc
    if (e.target.closest(".delete")) {
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
            tasks.splice(taskIndex, 1); // Xóa công việc khỏi mảng
            renderTasks(); // Hiển thị lại danh sách công việc
            saveTasks(); // Lưu danh sách vào localStorage
        }
    }
}

// Thêm công việc mới
function addTask(e) {
    e.preventDefault(); // Ngăn chặn hành vi mặc định của form
    const value = todoInput.value.trim(); // Lấy giá trị input và xóa khoảng trắng thừa
    if (!value) return alert("Please write something!"); // Cảnh báo nếu input rỗng

    if (isDuplicateTask(value)) {
        alert(
            "Task with this title already exists! Please use a different title."
        ); // Cảnh báo nếu tiêu đề trùng lặp
        return;
    }

    tasks.push({
        title: value, // Tiêu đề công việc
        completed: false, // Mặc định chưa hoàn thành
    });
    renderTasks(); // Hiển thị lại danh sách công việc
    saveTasks(); // Lưu danh sách vào localStorage
    todoInput.value = ""; // Xóa giá trị input
}

// Hiển thị danh sách công việc
function renderTasks() {
    if (!tasks.length) {
        taskList.innerHTML =
            '<li class="empty-message">No tasks available.</li>'; // Hiển thị thông báo nếu danh sách rỗng
        return;
    }

    const html = tasks
        .map(
            (task, index) => `
    <li class="task-item ${
        task.completed ? "completed" : "" // Thêm class "completed" nếu công việc đã hoàn thành
    }" data-index="${index}">
        <span class="task-title">${escapeHTML(
            task.title
        )}</span> <!-- Escape tiêu đề công việc -->
        <div class="task-action">
            <button class="task-btn edit">Edit</button> <!-- Nút sửa -->
            <button class="task-btn done">${
                task.completed ? "Mark as undone" : "Mark as done"
            }</button> <!-- Nút hoàn thành -->
            <button class="task-btn delete">Delete</button> <!-- Nút xóa -->
        </div>
    </li>
`
        )
        .join(""); // Kết hợp tất cả các phần tử thành một chuỗi HTML

    taskList.innerHTML = html; // Chèn HTML vào danh sách
}

// Lắng nghe sự kiện submit của form
todoForm.addEventListener("submit", addTask);

// Lắng nghe sự kiện click trên danh sách công việc
taskList.addEventListener("click", handleTaskActions);

// Hiển thị danh sách công việc khi tải trang
renderTasks();
