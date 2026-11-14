
"use strict";

const STORAGE_KEY = "taskflow_tasks";

const elements = {
    form: document.getElementById("task-form"),
    input: document.getElementById("task-input"),
    priority: document.getElementById("priority-input"),
    list: document.getElementById("task-list"),
    count: document.getElementById("task-count"),
    remaining: document.getElementById("remaining-count"),
    percent: document.getElementById("progress-percent"),
    progress: document.getElementById("progress-fill"),
    progressTrack: document.getElementById("progress-track"),
    progressText: document.getElementById("progress-text"),
    filters: document.querySelector(".filter-container"),
    clear: document.getElementById("clear-completed"),
    addButton: document.getElementById("add-button"),
    date: document.getElementById("current-date")
};

let tasks = loadTasks();
let currentFilter = "all";
let editingId = null;

function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!Array.isArray(saved)) return [];

        return saved.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.completed === "boolean" &&
            ["low", "medium", "high"].includes(task.priority)
        );
    } catch {
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch {
        return false;
    }
}

function createId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getFilteredTasks() {
    if (currentFilter === "active") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

function createEmptyState() {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";

    const heading = document.createElement("h3");

    if (currentFilter === "completed") {
        heading.textContent = "No completed tasks";
    } else if (currentFilter === "active") {
        heading.textContent = "No active tasks";
    } else {
        heading.textContent = "No tasks yet";
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = currentFilter === "all"
        ? "Add your first task and start being productive."
        : "Your tasks will appear here.";

    empty.append(icon, heading, paragraph);

    return empty;
}

function createTaskElement(task) {
    const item = document.createElement("article");

    item.className = task.completed
        ? "task-item completed"
        : "task-item";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.dataset.action = "toggle";
    checkbox.dataset.id = task.id;
    checkbox.setAttribute("aria-label", `Complete ${task.title}`);

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

    editButton.type = "button";
    editButton.className = "action-btn";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";
    editButton.dataset.id = task.id;
    editButton.setAttribute("aria-label", `Edit ${task.title}`);

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "action-btn";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = task.id;
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

    actions.append(editButton, deleteButton);
    item.append(checkbox, details, actions);

    return item;
}

function updateStatistics() {
    let completed = 0;

    for (const task of tasks) {
        if (task.completed) completed++;
    }

    const total = tasks.length;
    const remaining = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    elements.count.textContent =
        `${total} ${total === 1 ? "Task" : "Tasks"}`;

    elements.remaining.textContent =
        `${remaining} ${remaining === 1 ? "task" : "tasks"} remaining`;

    elements.percent.textContent = `${percentage}%`;

    elements.progress.style.width = `${percentage}%`;

    elements.progressTrack.setAttribute(
        "aria-valuenow",
        String(percentage)
    );

    elements.progressText.textContent =
        `${completed} of ${total} tasks completed`;
}

function renderTasks() {
    const fragment = document.createDocumentFragment();
    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        fragment.append(createEmptyState());
    } else {
        for (const task of filteredTasks) {
            fragment.append(createTaskElement(task));
        }
    }

    elements.list.replaceChildren(fragment);

    updateStatistics();
}

function resetForm() {
    editingId = null;
    elements.form.reset();
    elements.priority.value = "medium";
    elements.addButton.textContent = "+ Add Task";
}

elements.form.addEventListener("submit", event => {
    event.preventDefault();

    const title = elements.input.value.trim();

    if (!title) {
        elements.input.focus();
        return;
    }

    if (editingId !== null) {
        const task = tasks.find(item => item.id === editingId);

        if (task) {
            task.title = title;
            task.priority = elements.priority.value;
        }
    } else {
        tasks.unshift({
            id: createId(),
            title,
            priority: elements.priority.value,
            completed: false
        });
    }

    resetForm();
    saveTasks();
    renderTasks();

    elements.input.focus();
});

elements.list.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const { action, id } = button.dataset;

    const task = tasks.find(item => item.id === id);

    if (!task) return;

    if (action === "edit") {
        editingId = id;

        elements.input.value = task.title;
        elements.priority.value = task.priority;
        elements.addButton.textContent = "Save Task";

        elements.input.focus();
        return;
    }

    if (action === "delete") {
        tasks = tasks.filter(item => item.id !== id);

        if (editingId === id) {
            resetForm();
        }

        saveTasks();
        renderTasks();
    }
});

elements.list.addEventListener("change", event => {
    const checkbox = event.target.closest(
        'input[data-action="toggle"]'
    );

    if (!checkbox) return;

    const task = tasks.find(
        item => item.id === checkbox.dataset.id
    );

    if (!task) return;

    task.completed = checkbox.checked;

    saveTasks();
    renderTasks();
});

elements.filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");

    if (!button) return;

    currentFilter = button.dataset.filter;

    for (const filterButton of elements.filters.querySelectorAll(
        ".filter-btn"
    )) {
        const active = filterButton === button;

        filterButton.classList.toggle("active", active);
        filterButton.setAttribute("aria-pressed", String(active));
    }

    renderTasks();
});

elements.clear.addEventListener("click", () => {
    tasks = tasks.filter(task => !task.completed);

    if (
        editingId !== null &&
        !tasks.some(task => task.id === editingId)
    ) {
        resetForm();
    }

    saveTasks();
    renderTasks();
});

function displayDate() {
    const date = new Date();

    elements.date.dateTime = date.toISOString();

    elements.date.textContent = new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

displayDate();
renderTasks();
