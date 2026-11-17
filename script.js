// All interface copy lives in this dictionary.
const translations = {
  ru: {
    brandLabel: "На главную Taskflow",
    languageLabel: "Язык",
    filtersLabel: "Фильтры задач",
    eyebrow: "ВАШЕ ЛИЧНОЕ ПРОСТРАНСТВО",
    title: "Маленький шаг каждый день.",
    subtitle: "Планируйте спокойно и сосредоточьтесь на главном.",
    taskPlaceholder: "Что нужно сделать?",
    priority: "Приоритет",
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
    add: "Добавить",
    myTasks: "Мои задачи",
    clearCompleted: "Очистить выполненные",
    all: "Все",
    active: "Активные",
    completed: "Выполненные",
    emptyTitle: "Пока задач нет",
    emptyText: "Добавьте первую задачу и сделайте сегодняшний день продуктивнее.",
    localHint: "Сохранено на этом устройстве",
    pageNote: "Освободите время для самого важного.",
    count: "Осталось: {active} из {total}",
    delete: "Удалить задачу",
    changePriority: "Изменить приоритет",
    themeLight: "Включить светлую тему",
    themeDark: "Включить тёмную тему",
    sortLabel: "Сортировка",
    sortCreated: "Сначала новые",
    sortPriority: "По приоритету",
    sortAlpha: "А → Я",
    sortAlphaDesc: "Я → А"
  },
  en: {
    brandLabel: "Taskflow home",
    languageLabel: "Language",
    filtersLabel: "Task filters",
    eyebrow: "YOUR PERSONAL SPACE",
    title: "A little progress every day.",
    subtitle: "Keep your plans clear and your focus close.",
    taskPlaceholder: "What needs to be done?",
    priority: "Priority",
    low: "Low",
    medium: "Medium",
    high: "High",
    add: "Add task",
    myTasks: "My tasks",
    clearCompleted: "Clear completed",
    all: "All",
    active: "Active",
    completed: "Completed",
    emptyTitle: "No tasks yet",
    emptyText: "Add your first one and make today count.",
    localHint: "Saved on this device",
    pageNote: "Make space for what matters.",
    count: "{active} of {total} left",
    delete: "Delete task",
    changePriority: "Change priority",
    themeLight: "Switch to light theme",
    themeDark: "Switch to dark theme",
    sortLabel: "Sort by",
    sortCreated: "Newest first",
    sortPriority: "By priority",
    sortAlpha: "A → Z",
    sortAlphaDesc: "Z → A"
  }
};

const STORAGE_KEYS = {
  tasks: "tasks",
  filter: "filter",
  theme: "theme",
  language: "language",
  sort: "sort",
  priority: "priority"
};

const validFilters = ["all", "active", "completed"];
const validPriorities = ["low", "medium", "high"];
const validSorts = ["created", "priority", "alpha", "alpha-desc"];

const priorityRank = { high: 0, medium: 1, low: 2 };

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Unable to save app state:", error);
  }
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitialLanguage() {
  const saved = readStorage(STORAGE_KEYS.language, null);
  if (saved === "ru" || saved === "en") return saved;
  return navigator.language && navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

function getInitialTheme() {
  const saved = readStorage(STORAGE_KEYS.theme, null);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function normalizeTasks(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((task) =>
    task && typeof task.id === "string" &&
    typeof task.text === "string" && task.text.trim().length > 0
  ).map((task) => ({
    id: task.id,
    text: task.text.trim(),
    done: Boolean(task.done),
    priority: validPriorities.includes(task.priority) ? task.priority : "medium",
    createdAt: Number.isFinite(task.createdAt) ? task.createdAt : Date.now()
  }));
}

let tasks = normalizeTasks(readStorage(STORAGE_KEYS.tasks, []));
let currentFilter = readStorage(STORAGE_KEYS.filter, "all");
if (!validFilters.includes(currentFilter)) currentFilter = "all";
let currentSort = readStorage(STORAGE_KEYS.sort, "created");
if (!validSorts.includes(currentSort)) currentSort = "created";
let lastPriority = readStorage(STORAGE_KEYS.priority, "medium");
if (!validPriorities.includes(lastPriority)) lastPriority = "medium";
let language = getInitialLanguage();
let theme = getInitialTheme();

const elements = {
  form: document.querySelector("#task-form"),
  input: document.querySelector("#task-input"),
  priority: document.querySelector("#priority-select"),
  list: document.querySelector("#task-list"),
  template: document.querySelector("#task-template"),
  empty: document.querySelector("#empty-state"),
  count: document.querySelector("#task-count"),
  clear: document.querySelector("#clear-completed"),
  filters: [...document.querySelectorAll("[data-filter]")],
  sort: document.querySelector("#sort-select"),
  language: document.querySelector("#language-select"),
  theme: document.querySelector("#theme-toggle"),
  themeIcon: document.querySelector("#theme-icon")
};

function t(key) {
  return translations[language][key] ?? key;
}

function saveTasks() {
  writeStorage(STORAGE_KEYS.tasks, tasks);
}

function applyTranslations() {
  document.documentElement.lang = language;
  elements.language.value = language;
  elements.sort.value = currentSort;
  elements.priority.value = lastPriority;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });
  document.title = `Taskflow — ${language === "ru" ? "Список задач" : "To-Do List"}`;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === currentFilter);
    button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
  });
  elements.theme.setAttribute("aria-label", theme === "dark" ? t("themeLight") : t("themeDark"));
  elements.theme.title = elements.theme.getAttribute("aria-label");
  elements.themeIcon.textContent = theme === "dark" ? "☀" : "☾";
  renderTasks();
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#171923" : "#f5f6fa";
  elements.theme.setAttribute("aria-label", theme === "dark" ? t("themeLight") : t("themeDark"));
  elements.theme.title = elements.theme.getAttribute("aria-label");
  elements.themeIcon.textContent = theme === "dark" ? "☀" : "☾";
}

function sortTasks(list) {
  const copy = [...list];
  if (currentSort === "priority") {
    copy.sort((a, b) => {
      const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
      if (byPriority !== 0) return byPriority;
      return b.createdAt - a.createdAt;
    });
  } else if (currentSort === "alpha" || currentSort === "alpha-desc") {
    const direction = currentSort === "alpha-desc" ? -1 : 1;
    copy.sort((a, b) => direction * a.text.localeCompare(b.text, language, { sensitivity: "base" }));
  } else {
    copy.sort((a, b) => b.createdAt - a.createdAt);
  }
  return copy;
}

function getVisibleTasks() {
  let visible;
  if (currentFilter === "active") visible = tasks.filter((task) => !task.done);
  else if (currentFilter === "completed") visible = tasks.filter((task) => task.done);
  else visible = tasks;
  return sortTasks(visible);
}

function updateCounter() {
  const activeCount = tasks.filter((task) => !task.done).length;
  const formattedActive = new Intl.NumberFormat(language).format(activeCount);
  const formattedTotal = new Intl.NumberFormat(language).format(tasks.length);
  elements.count.textContent = t("count")
    .replace("{active}", formattedActive)
    .replace("{total}", formattedTotal);
  elements.clear.disabled = !tasks.some((task) => task.done);
  elements.clear.style.opacity = elements.clear.disabled ? ".45" : "1";
}

function renderTasks() {
  elements.list.replaceChildren();
  const visibleTasks = getVisibleTasks();

  visibleTasks.forEach((task) => {
    const fragment = elements.template.content.cloneNode(true);
    const item = fragment.querySelector(".task-item");
    const checkbox = fragment.querySelector(".task-checkbox");
    const text = fragment.querySelector(".task-text");
    const priorityDot = fragment.querySelector(".priority-dot");
    const prioritySelect = fragment.querySelector(".task-priority");
    const deleteButton = fragment.querySelector(".delete-button");

    item.dataset.id = task.id;
    item.classList.toggle("is-done", task.done);
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", task.text);
    text.textContent = task.text;
    priorityDot.dataset.priority = task.priority;
    prioritySelect.value = task.priority;
    prioritySelect.querySelectorAll("option").forEach((option) => {
      option.textContent = t(option.value);
    });
    prioritySelect.setAttribute("aria-label", t("changePriority"));
    deleteButton.setAttribute("aria-label", t("delete"));
    deleteButton.title = t("delete");

    checkbox.addEventListener("change", () => {
      updateTask(task.id, { done: checkbox.checked });
    });
    prioritySelect.addEventListener("change", () => {
      updateTask(task.id, { priority: prioritySelect.value });
    });
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((entry) => entry.id !== task.id);
      saveTasks();
      renderTasks();
    });

    elements.list.append(fragment);
  });

  elements.empty.hidden = visibleTasks.length !== 0;
  updateCounter();
}

function addTask(text, priority) {
  const cleanText = text.trim();
  if (!cleanText) return;
  tasks.unshift({
    id: createId(),
    text: cleanText,
    done: false,
    priority: validPriorities.includes(priority) ? priority : "medium",
    createdAt: Date.now()
  });
  saveTasks();
  renderTasks();
}

function updateTask(id, changes) {
  tasks = tasks.map((task) => task.id === id ? { ...task, ...changes } : task);
  saveTasks();
  renderTasks();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = elements.input.value;
  if (!value.trim()) {
    elements.input.focus();
    return;
  }
  addTask(value, elements.priority.value);
  lastPriority = elements.priority.value;
  writeStorage(STORAGE_KEYS.priority, lastPriority);
  elements.input.value = "";
  elements.input.focus();
});

elements.priority.addEventListener("change", () => {
  lastPriority = elements.priority.value;
  writeStorage(STORAGE_KEYS.priority, lastPriority);
});

elements.clear.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
});

elements.filters.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    writeStorage(STORAGE_KEYS.filter, currentFilter);
    applyTranslations();
  });
});

elements.sort.addEventListener("change", () => {
  currentSort = elements.sort.value;
  writeStorage(STORAGE_KEYS.sort, currentSort);
  renderTasks();
});

elements.language.addEventListener("change", () => {
  language = elements.language.value;
  writeStorage(STORAGE_KEYS.language, language);
  applyTranslations();
});

elements.theme.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  writeStorage(STORAGE_KEYS.theme, theme);
  applyTheme();
});

// Initialize preferences and focus the entry field on load.
applyTheme();
applyTranslations();
window.addEventListener("load", () => elements.input.focus());