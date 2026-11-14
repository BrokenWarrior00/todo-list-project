
const STORAGE_KEY = "taskflow_tasks";

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const priorityInput = document.getElementById("priority-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const remainingCount = document.getElementById("remaining-count");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const filterButtons = document.querySelector(".filter-container");
const clearCompleted = document.getElementById("clear-completed");

let tasks = loadTasks();
let currentFilter = "all";
let editingId = null;

function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved)
            ? saved.filter(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.title === "string" &&
                typeof task.completed === "boolean" &&
                ["low", "medium", "high"].includes(task.priority)
            )
            : [];
    } catch {
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
        console.warn("Unable to save tasks.");
    }
}

function createId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function renderTasks() {
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    const fragment = document.createDocumentFragment();

    if (filteredTasks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";

        const icon = document.createElement("div");
        icon.className = "empty-icon";
        icon.textContent = "✦";

        const heading = document.createElement("h3");
        heading.textContent = currentFilter === "completed"
            ? "No completed tasks"
            : currentFilter === "active"
                ? "No active tasks"
                : "No tasks yet";

        const paragraph = document.createElement("p");
        paragraph.textContent = currentFilter === "all"
            ? "Add your first task and start being productive."
            : "Your tasks will appear here.";

        empty.append(icon, heading, paragraph);
        fragment.append(empty);
    } else {
        filteredTasks.forEach(task => {
            const item = document.createElement("article");
            item.className = `task-item${task.completed ? " completed" : ""}`;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "task-check";
            checkbox.checked = task.completed;
            checkbox.setAttribute("aria-label", `Complete ${task.title}`);
            checkbox.dataset.action = "toggle";
            checkbox.dataset.id = task.id;

            const details = document.createElement("div");
            details.className = "task-details";

            const title = document.createElement("p");
            title.className = "task-title";
            title.textContent = task.title;

            const meta = document.createElement("div");
            meta.className = "task-meta";

            const priority = document.createElement("span");
            priority.className = `priority ${task.priority}`;
            priority.textContent = `${task.priority} priority`;

            meta.append(priority);
            details.append(title, meta);

            const actions = document.createElement("div");
            actions.className = "task-actions";

            const editButton = document.createElement("button");
            editButton.className = "action-btn";
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            editButton.dataset.id = task.id;
            editButton.setAttribute("aria-label", `Edit ${task.title}`);

            const deleteButton = document.createElement("button");
            deleteButton.className = "action-btn";
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.id = task.id;
            deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

            actions.append(editButton, deleteButton);
            item.append(checkbox, details, actions);
            fragment.append(item);
        });
    }

    taskList.replaceChildren(fragment);
    updateStatistics();
}

function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const remaining = total - completed;
    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    taskCount.textContent = `${total} ${total === 1 ? "Task" : "Tasks"}`;
    remainingCount.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} remaining`;
    progressPercent.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${completed} of ${total} tasks completed`;
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        taskInput.focus();
        return;
    }

    if (editingId) {
        const task = tasks.find(item => item.id === editingId);

        if (task) {
            task.title = title;
            task.priority = priorityInput.value;
        }

        editingId = null;
        document.getElementById("add-button").textContent = "+ Add Task";
    } else {
        tasks.unshift({
            id: createId(),
            title,
            priority: priorityInput.value,
            completed: false
        });
    }

    saveTasks();
    taskForm.reset();
    priorityInput.value = "medium";
    renderTasks();
    taskInput.focus();
});

taskList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const { action, id } = button.dataset;
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    if (action === "edit") {
        editingId = id;
        taskInput.value = task.title;
        priorityInput.value = task.priority;
        document.getElementById("add-button").textContent = "Save Task";
        taskInput.focus();
    }

    if (action === "delete") {
        tasks = tasks.filter(item => item.id !== id);

        if (editingId === id) {
            editingId = null;
            taskForm.reset();
            document.getElementById("add-button").textContent = "+ Add Task";
        }

        saveTasks();
        renderTasks();
    }
});

taskList.addEventListener("change", event => {
    const checkbox = event.target.closest('input[data-action="toggle"]');

    if (!checkbox) return;

    const task = tasks.find(item => item.id === checkbox.dataset.id);

    if (task) {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
    }
});

filterButtons.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");

    if (!button) return;

    currentFilter = button.dataset.filter;

    filterButtons.querySelectorAll(".filter-btn").forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
    });

    renderTasks();
});

clearCompleted.addEventListener("click", () => {
    tasks = tasks.filter(task => !task.completed);

    if (editingId && !tasks.some(task => task.id === editingId)) {
        editingId = null;
        taskForm.reset();
        document.getElementById("add-button").textContent = "+ Add Task";
    }

    saveTasks();
    renderTasks();
});

function displayDate() {
    const date = new Date();

    document.getElementById("current-date").textContent =
        date.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}

displayDate();
renderTasks();

filterButtons.querySelectorAll(".filter-btn").forEach(button => {
    button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === currentFilter)
    );
});
