import { Component } from '@angular/core';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';
import { TimerComponent } from '../timer/timer.component';
import { TodoListComponent } from '../todo-list/todo-list.component';

@Component({
  imports: [TimerComponent, TodoListComponent, AboutComponent, ContactComponent],
  selector: 'app-home',
  styleUrl: './home.component.scss',
  templateUrl: './home.component.html',
})
export class HomeComponent {}