import { Service, computed, inject, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';
import { TimerStateService } from './timer-state.service';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface SessionCompletions {
  /** Matches TimerStateService.focusSessionStartedAt for the session these ids belong to. */
  sessionStartedAt: number | null;
  ids: string[];
}

interface PersistedTodos {
  todos: Todo[];
  session: SessionCompletions;
}

export const MAX_OPEN_TODOS = 10;
export const MAX_TODO_LENGTH = 120;
export const TODOS_STORAGE_KEY = 'bomodoro.todos';

@Service()
export class TodoService {
  private readonly timer = inject(TimerStateService);

  private readonly _todos = signal<Todo[]>([]);
  private readonly _session = signal<SessionCompletions>({ sessionStartedAt: null, ids: [] });

  readonly todos = this._todos.asReadonly();
  readonly openCount = computed(() => this._todos().filter(t => !t.completed).length);
  readonly completedCount = computed(() => this._todos().length - this.openCount());
  readonly canAdd = computed(() => this.openCount() < MAX_OPEN_TODOS);
  /** Tasks completed since the current focus session started (resets when a new focus session starts). */
  readonly completedThisSession = computed(() => this.currentSessionIds().length);

  constructor() {
    this.restore();
  }

  add(text: string): boolean {
    const clean = normalizeText(text);
    if (!clean || !this.canAdd()) {
      return false;
    }
    this._todos.update(todos => [...todos, { id: createId(), text: clean, completed: false }]);
    this.persist();
    return true;
  }

  rename(id: string, text: string): boolean {
    const clean = normalizeText(text);
    if (!clean) {
      return false;
    }
    this._todos.update(todos => todos.map(t => (t.id === id ? { ...t, text: clean } : t)));
    this.persist();
    return true;
  }

  /** Reopening is refused when it would exceed the open-task limit. */
  setCompleted(id: string, completed: boolean): boolean {
    const todo = this._todos().find(t => t.id === id);
    if (!todo || todo.completed === completed) {
      return false;
    }
    if (!completed && !this.canAdd()) {
      return false;
    }

    this._todos.update(todos => todos.map(t => (t.id === id ? { ...t, completed } : t)));
    const ids = this.currentSessionIds();
    this._session.set({
      sessionStartedAt: this.timer.focusSessionStartedAt(),
      ids: completed ? [...ids, id] : ids.filter(x => x !== id),
    });
    this.persist();
    return true;
  }

  remove(id: string): void {
    this._todos.update(todos => todos.filter(t => t.id !== id));
    this.persist();
  }

  clearCompleted(): void {
    this._todos.update(todos => todos.filter(t => !t.completed));
    this.persist();
  }

  private currentSessionIds(): string[] {
    const session = this._session();
    return session.sessionStartedAt === this.timer.focusSessionStartedAt() ? session.ids : [];
  }

  private persist(): void {
    const state: PersistedTodos = { todos: this._todos(), session: this._session() };
    writeStorage(TODOS_STORAGE_KEY, state);
  }

  private restore(): void {
    const saved = readStorage<PersistedTodos>(TODOS_STORAGE_KEY);
    if (!saved || !Array.isArray(saved.todos)) {
      return;
    }
    const todos = saved.todos
      .filter(t => t && typeof t.id === 'string' && typeof t.text === 'string')
      .map(t => ({ id: t.id, text: normalizeText(t.text), completed: !!t.completed }))
      .filter(t => t.text);
    this._todos.set(todos);

    const session = saved.session;
    if (session && Array.isArray(session.ids)) {
      this._session.set({
        sessionStartedAt: Number.isFinite(session.sessionStartedAt) ? session.sessionStartedAt : null,
        ids: session.ids.filter(id => typeof id === 'string'),
      });
    }
  }
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').slice(0, MAX_TODO_LENGTH);
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
