import { Directive, Input, TemplateRef, inject } from '@angular/core';

@Directive({ selector: 'ng-template[tableCell]', standalone: true })
export class TableCellDirective {
  @Input({ required: true }) tableCell = '';
  readonly template = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}
