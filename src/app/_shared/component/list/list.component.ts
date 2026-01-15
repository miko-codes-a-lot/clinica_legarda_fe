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
  @Input() labelMap: Record<string, string> = {};

  dataInRows: [string, any][][] = [];

  constructor(private datePipe: DatePipe) {}

  ngOnChanges() {
    this.buildRows();
  }

  private buildRows() {
    const entries = Object.entries(this.data);
    const rows: [string, any][][] = [];

    for (let i = 0; i < entries.length; i += 2) {
      rows.push(entries.slice(i, i + 2));
    }

    this.dataInRows = rows;
  }

  formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^./, str => str.toUpperCase());
  }

  formatValue(value: any, key: string): any {
    if (key.toLowerCase().includes('date')) {
      return this.datePipe.transform(value, 'mediumDate');
    }
    return value;
  }
}
