import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './charts.html',
  styleUrls: ['./charts.css'],
})
export class Charts {
  @Input() vitals: any | undefined = undefined;
}
