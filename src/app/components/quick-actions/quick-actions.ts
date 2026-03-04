import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-actions.html',
  styleUrls: ['./quick-actions.css'],
})
export class QuickActions {
  @Output() action = new EventEmitter<string>();

  trigger(name: string) {
    this.action.emit(name);
  }
}
