import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts-list.html',
  styleUrls: ['./alerts-list.css'],
})
export class AlertsList {
  @Input() alerts: Array<any> | undefined = undefined;
}
