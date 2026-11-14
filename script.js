
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

const emptyMessage = document.getElementById("empty-message");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const remainingCount = document.getElementById("remaining-count");

const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = [];
let currentFilter = "all";

function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Unable to save tasks:", error);
    }
}

function loadTasks() {
    const savedTasks = localStorage.getItem("tasks");

    if (savedTasks !== null) {
        try {
            const parsedTasks = JSON.parse(savedTasks);

            if (Array.isArray(parsedTasks)) {
                tasks = parsedTasks.filter(task =>
                task &&
                Number.isFinite(task.id) &&
                typeof task.text === "string" &&
                typeof task.completed === "boolean"
                );
            }
        } catch (error) {
            console.error("Unable to load tasks:", error);
            tasks = [];
        }
    }

    displayTasks();
}

function updateCounts() {
    const completed = tasks.filter(task => task.completed).length;

    totalCount.textContent = tasks.length;
    completedCount.textContent = completed;
    remainingCount.textContent = tasks.length - completed;
}

function displayTasks() {
    taskList.innerHTML = "";

    let filteredTasks = tasks;

    if (currentFilter === "active") {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === "completed") {
        filteredTasks = tasks.filter(task => task.completed);
    }

    filteredTasks.forEach(task => {
        const li = document.createElement("li");
        li.dataset.id = task.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.dataset.action = "toggle";
        checkbox.setAttribute("aria-label", "Mark task as completed");

        const taskText = document.createElement("span");
        taskText.textContent = task.text;

        const actions = document.createElement("div");
        actions.classList.add("task-actions");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";

        actions.append(editButton, deleteButton);
        li.append(checkbox, taskText, actions);

        if (task.completed) {
            li.classList.add("completed");
        }

        taskList.appendChild(li);
    });

    if (filteredTasks.length === 0) {
        emptyMessage.style.display = "block";

        if (tasks.length === 0) {
            emptyMessage.textContent = "No tasks yet. Add your first task!";
        } else if (currentFilter === "active") {
            emptyMessage.textContent = "No active tasks. You're all caught up!";
        } else if (currentFilter === "completed") {
            emptyMessage.textContent = "No completed tasks yet.";
        }
    } else {
        emptyMessage.style.display = "none";
    }

    updateCounts();
}

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();

    if (taskText === "") {
        return;
    }

    const newTask = {
        id: Date.now(),
                          text: taskText,
                          completed: false
    };

    tasks.push(newTask);

    saveTasks();

    taskInput.value = "";

    displayTasks();
});

taskList.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button || !taskList.contains(button)) {
        return;
    }

    const li = button.closest("li");
    const taskId = Number(li.dataset.id);

    const task = tasks.find(task => task.id === taskId);

    if (!task) {
        return;
    }

    if (button.dataset.action === "delete") {
        tasks = tasks.filter(task => task.id !== taskId);

        saveTasks();
        displayTasks();
    }

    else if (button.dataset.action === "edit") {
        const updatedText = prompt("Edit your task:", task.text);

        if (updatedText !== null && updatedText.trim() !== "") {
            task.text = updatedText.trim();

            saveTasks();
            displayTasks();
        }
    }
});

taskList.addEventListener("change", function(event) {
    if (event.target.dataset.action === "toggle") {
        const li = event.target.closest("li");
        const taskId = Number(li.dataset.id);

        const task = tasks.find(task => task.id === taskId);

        if (task) {
            task.completed = event.target.checked;

            saveTasks();
            displayTasks();
        }
    }
});

filterButtons.forEach(button => {
    button.addEventListener("click", function() {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        displayTasks();
    });
});

loadTasks();
