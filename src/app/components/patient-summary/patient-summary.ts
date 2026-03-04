import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-summary.html',
  styleUrls: ['./patient-summary.css'],
})
export class PatientSummary {
  @Input() summary: any | undefined = undefined;
}
