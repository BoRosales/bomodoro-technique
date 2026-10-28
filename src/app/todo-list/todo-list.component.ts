import { Component, ElementRef, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { MAX_OPEN_TODOS, MAX_TODO_LENGTH, Todo, TodoService } from '../todo.service';

@Component({
  imports: [],
  selector: 'app-todo-list',
  styleUrl: './todo-list.component.scss',
  templateUrl: './todo-list.component.html',
})
export class TodoListComponent {
  protected readonly todos = inject(TodoService);
  private readonly injector = inject(Injector);

  protected readonly maxOpen = MAX_OPEN_TODOS;
  protected readonly maxLength = MAX_TODO_LENGTH;
  protected readonly draft = signal('');
  protected readonly editingId = signal<string | null>(null);
  protected readonly editDraft = signal('');

  private readonly editInput = viewChild<ElementRef<HTMLInputElement>>('editInput');

  add(event: Event): void {
    event.preventDefault();
    if (this.todos.add(this.draft())) {
      this.draft.set('');
    }
  }

  toggle(todo: Todo, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (!this.todos.setCompleted(todo.id, checkbox.checked)) {
      checkbox.checked = todo.completed;
    }
  }

  startEdit(todo: Todo): void {
    this.editingId.set(todo.id);
    this.editDraft.set(todo.text);
    afterNextRender(() => this.editInput()?.nativeElement.select(), { injector: this.injector });
  }

  saveEdit(id: string): void {
    // Blur also fires after Enter/Escape removes the input; ignore it then.
    if (this.editingId() !== id) {
      return;
    }
    this.todos.rename(id, this.editDraft());
    this.editingId.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }
}