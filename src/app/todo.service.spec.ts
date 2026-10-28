import { TestBed } from '@angular/core/testing';
import { ChimeService } from './chime.service';
import { TimerStateService } from './timer-state.service';
import { MAX_OPEN_TODOS, MAX_TODO_LENGTH, TODOS_STORAGE_KEY, TodoService } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;
  let timer: TimerStateService;

  function setup(): void {
    TestBed.configureTestingModule({
      providers: [{ provide: ChimeService, useValue: { play: vi.fn(), prime: vi.fn() } }],
    });
    service = TestBed.inject(TodoService);
    timer = TestBed.inject(TimerStateService);
  }

  function reload(): void {
    TestBed.resetTestingModule();
    setup();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    setup();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('adds trimmed tasks and ignores blank ones', () => {
    expect(service.add('  Write   intro  ')).toBe(true);
    expect(service.add('   ')).toBe(false);
    expect(service.todos().map(t => t.text)).toEqual(['Write intro']);
  });

  it('caps task text length', () => {
    service.add('x'.repeat(MAX_TODO_LENGTH + 50));
    expect(service.todos()[0].text.length).toBe(MAX_TODO_LENGTH);
  });

  it('limits open tasks but not completed ones', () => {
    for (let i = 0; i < MAX_OPEN_TODOS; i++) {
      expect(service.add(`Task ${i}`)).toBe(true);
    }
    expect(service.canAdd()).toBe(false);
    expect(service.add('One too many')).toBe(false);

    service.setCompleted(service.todos()[0].id, true);
    expect(service.canAdd()).toBe(true);
    expect(service.add('Now it fits')).toBe(true);
    expect(service.todos().length).toBe(MAX_OPEN_TODOS + 1);
  });

  it('refuses to reopen a task when the open limit is reached', () => {
    for (let i = 0; i < MAX_OPEN_TODOS; i++) {
      service.add(`Task ${i}`);
    }
    const first = service.todos()[0].id;
    service.setCompleted(first, true);
    service.add('Fill the slot');

    expect(service.setCompleted(first, false)).toBe(false);
    expect(service.todos()[0].completed).toBe(true);
  });

  it('renames, removes and clears completed tasks', () => {
    service.add('A');
    service.add('B');
    service.add('C');
    const [a, b, c] = service.todos();

    expect(service.rename(a.id, '  A2 ')).toBe(true);
    expect(service.rename(a.id, '   ')).toBe(false);
    service.remove(b.id);
    service.setCompleted(c.id, true);
    expect(service.completedCount()).toBe(1);
    service.clearCompleted();

    expect(service.todos().map(t => t.text)).toEqual(['A2']);
  });

  it('counts completions in the current focus session and resets when a new one starts', () => {
    service.add('A');
    service.add('B');
    service.add('C');
    const [a, b, c] = service.todos();

    timer.start();
    service.setCompleted(a.id, true);
    service.setCompleted(b.id, true);
    expect(service.completedThisSession()).toBe(2);

    // Unchecking lowers the count; deleting a completed task does not.
    service.setCompleted(b.id, false);
    expect(service.completedThisSession()).toBe(1);
    service.remove(a.id);
    expect(service.completedThisSession()).toBe(1);

    // Finish focus; tasks completed during the break still count toward that session.
    vi.advanceTimersByTime(25 * 60_000 + 500);
    expect(timer.phase()).toBe('break');
    service.setCompleted(c.id, true);
    expect(service.completedThisSession()).toBe(2);

    // Starting the break doesn't reset; starting the next focus does.
    timer.start();
    expect(service.completedThisSession()).toBe(2);
    vi.advanceTimersByTime(5 * 60_000 + 500);
    vi.advanceTimersByTime(1);
    timer.start();
    expect(service.completedThisSession()).toBe(0);
  });

  it('does not reset the count when resuming a paused focus session', () => {
    service.add('A');
    timer.start();
    service.setCompleted(service.todos()[0].id, true);
    timer.pause();
    timer.start();
    expect(service.completedThisSession()).toBe(1);
  });

  it('persists tasks and the session count across reloads', () => {
    service.add('A');
    service.add('B');
    timer.start();
    service.setCompleted(service.todos()[0].id, true);

    reload();
    expect(service.todos().map(t => [t.text, t.completed])).toEqual([
      ['A', true],
      ['B', false],
    ]);
    expect(service.completedThisSession()).toBe(1);
  });

  it('ignores corrupt stored data', () => {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify({ todos: [{ id: 1 }, null, { id: 'ok', text: 'Fine' }] }));
    reload();
    expect(service.todos().map(t => t.text)).toEqual(['Fine']);

    localStorage.setItem(TODOS_STORAGE_KEY, '{oops');
    reload();
    expect(service.todos()).toEqual([]);
  });
});