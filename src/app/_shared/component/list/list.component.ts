import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
})
export class ListComponent {
  @Input() data: Record<string, any> = {};
  @Input() labelMap: Record<string, string> = {}; // optional label override

  formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')     // Add space before capital letters
      .replace(/[_-]/g, ' ')          // Replace _ or - with space
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  }
}
