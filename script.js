"use strict";

const STORAGE_KEY = "todo-list-items";
const filters = new Set(["all", "active", "completed"]);

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const message = document.querySelector("#app-message");
const progressCount = document.querySelector("#progress-count");
const progressBar = document.querySelector("#progress-bar");
const progress = document.querySelector(".progress");
const filterButtons = document.querySelectorAll("[data-filter]");

let todos = loadTodos();
let currentFilter = "all";

function showMessage(text, type = "danger") {
  message.textContent = text;
  message.className = `alert alert-${type}`;
}

function clearMessage() {
  message.textContent = "";
  message.className = "alert d-none";
}

function loadTodos() {
  try {
    const storedTodos = localStorage.getItem(STORAGE_KEY);
    if (storedTodos === null) {
      return [];
    }

    const parsedTodos = JSON.parse(storedTodos);
    if (
      !Array.isArray(parsedTodos) ||
      !parsedTodos.every(
        (todo) =>
          todo !== null &&
          typeof todo === "object" &&
          typeof todo.id === "string" &&
          typeof todo.text === "string" &&
          typeof todo.completed === "boolean",
      )
    ) {
      throw new Error("저장된 할 일 데이터 형식이 올바르지 않습니다.");
    }

    return parsedTodos;
  } catch (error) {
    console.error("할 일 데이터를 불러오지 못했습니다.", error);
    showMessage("저장된 할 일 데이터를 불러오지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    clearMessage();
    return true;
  } catch (error) {
    console.error("할 일 데이터를 저장하지 못했습니다.", error);
    showMessage("할 일 데이터를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
    return false;
  }
}

function getVisibleTodos() {
  if (currentFilter === "active") {
    return todos.filter((todo) => !todo.completed);
  }
  if (currentFilter === "completed") {
    return todos.filter((todo) => todo.completed);
  }
  return todos;
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = "list-group-item todo-item d-flex align-items-start gap-3 px-3 py-3";

  const checkbox = document.createElement("input");
  checkbox.className = "form-check-input todo-checkbox flex-shrink-0";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 상태`);
  checkbox.dataset.action = "toggle";
  checkbox.dataset.id = todo.id;

  const text = document.createElement("span");
  text.className = `todo-text flex-grow-1${todo.completed ? " is-completed" : ""}`;
  text.textContent = todo.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "todo-delete";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.id = todo.id;

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const iconPaths = [
    "M4 7h16",
    "M10 11v6",
    "M14 11v6",
    "M5 7l1 13h12l1-13",
    "M9 7V4h6v3",
  ];
  iconPaths.forEach((pathData) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    icon.append(path);
  });
  deleteButton.append(icon);

  item.append(checkbox, text, deleteButton);
  return item;
}

function render() {
  const visibleTodos = getVisibleTodos();
  list.replaceChildren(...visibleTodos.map(createTodoElement));

  if (todos.length === 0) {
    emptyState.textContent = "아직 할 일이 없습니다. 새로운 할 일을 추가해 보세요.";
    emptyState.classList.remove("d-none");
  } else if (visibleTodos.length === 0) {
    emptyState.textContent = "이 필터에 해당하는 할 일이 없습니다.";
    emptyState.classList.remove("d-none");
  } else {
    emptyState.classList.add("d-none");
  }

  const completedCount = todos.filter((todo) => todo.completed).length;
  const percentage = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);
  progressCount.textContent = `완료 ${completedCount} / 전체 ${todos.length}`;
  progressBar.style.width = `${percentage}%`;
  progressBar.textContent = `${percentage}%`;
  progress.setAttribute("aria-valuenow", String(percentage));

  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (text.length === 0) {
    showMessage("할 일 내용을 입력해 주세요.", "warning");
    input.focus();
    return;
  }

  todos.push({
    id: crypto.randomUUID(),
    text,
    completed: false,
  });
  input.value = "";
  clearMessage();
  saveTodos();
  render();
  input.focus();
});

list.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.dataset.action !== "toggle") {
    return;
  }

  const todo = todos.find((item) => item.id === target.dataset.id);
  if (!todo) {
    return;
  }

  todo.completed = target.checked;
  saveTodos();
  render();
});

list.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || target.dataset.action !== "delete") {
    return;
  }

  todos = todos.filter((todo) => todo.id !== target.dataset.id);
  saveTodos();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextFilter = button.dataset.filter;
    if (!filters.has(nextFilter)) {
      return;
    }
    currentFilter = nextFilter;
    render();
  });
});

render();
