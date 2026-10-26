const STORAGE_KEY = "todo-list-items";
const filters = {
  all: (todo) => true,
  active: (todo) => !todo.completed,
  completed: (todo) => todo.completed,
};

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyDescription = document.querySelector("#empty-description");
const progressCount = document.querySelector("#progress-count");
const progressPercent = document.querySelector("#progress-percent");
const progressBar = document.querySelector("#progress-bar");
const progressBarTrack = document.querySelector('[role="progressbar"]');
const visibleCount = document.querySelector("#visible-count");
const storageNotice = document.querySelector("#storage-notice");
const announcer = document.querySelector("#announcer");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let selectedFilter = "all";
let todos = loadTodos();

function isTodo(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.completed === "boolean"
  );
}

function showStorageNotice(message) {
  storageNotice.textContent = message;
  storageNotice.classList.remove("hidden");
}

function loadTodos() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return [];

    const parsedValue = JSON.parse(storedValue);
    if (Array.isArray(parsedValue) && parsedValue.every(isTodo)) {
      return parsedValue;
    }

    showStorageNotice("저장된 할 일 데이터 형식이 올바르지 않아 목록을 새로 시작합니다.");
  } catch (error) {
    if (error instanceof SyntaxError) {
      showStorageNotice("저장된 할 일 데이터를 읽을 수 없습니다. 새 목록으로 시작합니다.");
    } else {
      showStorageNotice("브라우저 저장 공간에 접근할 수 없습니다. 변경 사항이 저장되지 않을 수 있습니다.");
    }
  }
  return [];
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    showStorageNotice("할 일은 화면에 반영했지만 브라우저 저장 공간에 저장하지 못했습니다.");
  }
}

function createTodoRow(todo) {
  const row = document.createElement("li");
  row.className = "todo-row flex items-start gap-3 py-4 sm:gap-4";

  const checkbox = document.createElement("input");
  checkbox.className = "todo-checkbox mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 상태`);
  checkbox.addEventListener("change", () => {
    todo.completed = checkbox.checked;
    saveTodos();
    render();
  });

  const text = document.createElement("span");
  text.className = `min-w-0 flex-1 text-sm leading-6 ${todo.completed ? "text-slate-400 line-through" : "text-slate-700"}`;
  text.textContent = todo.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200";
  deleteButton.type = "button";
  deleteButton.textContent = "삭제";
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);
  deleteButton.addEventListener("click", () => {
    todos = todos.filter((item) => item.id !== todo.id);
    saveTodos();
    render();
    announcer.textContent = "할 일을 삭제했습니다.";
  });

  row.append(checkbox, text, deleteButton);
  return row;
}

function render() {
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const totalTodos = todos.length;
  const percentage = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100);
  const visibleTodos = todos.filter(filters[selectedFilter]);

  document.querySelector('[data-count="all"]').textContent = totalTodos;
  document.querySelector('[data-count="active"]').textContent = totalTodos - completedTodos;
  document.querySelector('[data-count="completed"]').textContent = completedTodos;
  progressCount.textContent = `${completedTodos} / ${totalTodos}`;
  progressPercent.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
  progressBarTrack.setAttribute("aria-valuenow", percentage);
  visibleCount.textContent = `${visibleTodos.length}개 항목`;
  todoList.replaceChildren(...visibleTodos.map(createTodoRow));

  filterButtons.forEach((button) => {
    const isSelected = button.dataset.filter === selectedFilter;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("bg-blue-50", isSelected);
    button.classList.toggle("text-blue-700", isSelected);
    button.classList.toggle("font-semibold", isSelected);
    button.classList.toggle("text-slate-600", !isSelected);
    button.classList.toggle("font-medium", !isSelected);
  });

  const hasVisibleTodos = visibleTodos.length > 0;
  emptyState.classList.toggle("hidden", hasVisibleTodos);
  if (!hasVisibleTodos && totalTodos === 0) {
    emptyTitle.textContent = "아직 등록된 할 일이 없어요";
    emptyDescription.textContent = "위 입력창에서 오늘 할 일을 추가해 보세요.";
  } else if (!hasVisibleTodos) {
    const filterName = selectedFilter === "active" ? "진행 중인" : "완료된";
    emptyTitle.textContent = `${filterName} 할 일이 없어요`;
    emptyDescription.textContent = "다른 필터를 선택하거나 새 할 일을 추가해 보세요.";
  }
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) {
    todoInput.focus();
    return;
  }

  todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false,
  });
  saveTodos();
  selectedFilter = "all";
  todoInput.value = "";
  render();
  announcer.textContent = "새 할 일을 추가했습니다.";
  todoInput.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedFilter = button.dataset.filter;
    render();
  });
});

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

render();
