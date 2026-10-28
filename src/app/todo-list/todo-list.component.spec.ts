import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChimeService } from '../chime.service';
import { TimerStateService } from '../timer-state.service';
import { MAX_OPEN_TODOS } from '../todo.service';
import { TodoListComponent } from './todo-list.component';

describe('TodoListComponent', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let el: HTMLElement;

  const q = <T extends Element = HTMLElement>(id: string) => el.querySelector<T>(`[data-testid="${id}"]`);
  const qa = <T extends Element = HTMLElement>(id: string) => [...el.querySelectorAll<T>(`[data-testid="${id}"]`)];
  const texts = () => qa('task-text').map(e => e.textContent!.trim());

  async function addTask(text: string): Promise<void> {
    const input = q<HTMLInputElement>('new-task')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    q<HTMLButtonElement>('add-task')!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [{ provide: ChimeService, useValue: { play: vi.fn(), prime: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('shows an empty state', () => {
    expect(q('empty')).toBeTruthy();
    expect(q('session-count')!.textContent).toContain('0');
    expect(q<HTMLButtonElement>('add-task')!.disabled).toBe(true);
  });

  it('adds tasks and clears the input', async () => {
    await addTask('Write intro');
    await addTask('Review PR');
    expect(texts()).toEqual(['Write intro', 'Review PR']);
    expect(q<HTMLInputElement>('new-task')!.value).toBe('');
    expect(q('limit')!.textContent).toContain(`2 of ${MAX_OPEN_TODOS}`);
  });

  it('completes a task, updates the session count and can clear it', async () => {
    TestBed.inject(TimerStateService).start();
    await addTask('Write intro');

    const checkbox = el.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.click();
    await fixture.whenStable();
    expect(el.querySelector('li')!.classList).toContain('todo__item--done');
    expect(q('session-count')!.textContent).toContain('1');

    q<HTMLButtonElement>('clear-completed')!.click();
    await fixture.whenStable();
    expect(texts()).toEqual([]);
    expect(q('session-count')!.textContent).toContain('1');
  });

  it('deletes a task', async () => {
    await addTask('A');
    await addTask('B');
    qa<HTMLButtonElement>('delete-task')[0].click();
    await fixture.whenStable();
    expect(texts()).toEqual(['B']);
  });

  it('edits a task on double-click; Enter saves and Escape cancels', async () => {
    await addTask('Old');

    q('task-text')!.dispatchEvent(new MouseEvent('dblclick'));
    await fixture.whenStable();
    let input = q<HTMLInputElement>('edit-input')!;
    input.value = 'New';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();
    expect(texts()).toEqual(['New']);

    q('task-text')!.dispatchEvent(new MouseEvent('dblclick'));
    await fixture.whenStable();
    input = q<HTMLInputElement>('edit-input')!;
    input.value = 'Discarded';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(texts()).toEqual(['New']);
  });

  it('disables adding at the open-task limit', async () => {
    for (let i = 0; i < MAX_OPEN_TODOS; i++) {
      await addTask(`Task ${i}`);
    }
    expect(q<HTMLInputElement>('new-task')!.disabled).toBe(true);
    expect(q('limit')!.textContent).toContain(`reached ${MAX_OPEN_TODOS} open tasks`);
  });
});