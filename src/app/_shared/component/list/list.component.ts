import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  providers: [DatePipe], 
})
export class ListComponent {
  @Input() data: Record<string, any> = {};
  @Input() labelMap: Record<string, string> = {}; // optional label override
  
  constructor(private datePipe: DatePipe) {}

  formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')     // Add space before capital letters
      .replace(/[_-]/g, ' ')          // Replace _ or - with space
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  }

  formatValue(value: any, key: string): any {
    // Optional: format values differently based on the key
    if (key.toLowerCase().includes('date')) {
      return this.datePipe.transform(value, 'mediumDate');
    }

    return value;
  }


  get dataInRows(): [string, any][][] {
    const entries = Object.entries(this.data);
    const rows: [string, any][][] = [];

    for (let i = 0; i < entries.length; i += 2) {
      rows.push(entries.slice(i, i + 2));
    }

    return rows;
  }
}
