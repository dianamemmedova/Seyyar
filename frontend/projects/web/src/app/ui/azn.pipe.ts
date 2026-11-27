import { Pipe, PipeTransform } from '@angular/core';

const format = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

// 145 -> "145 ₼", 1.5 -> "1.5 ₼", null -> ""
@Pipe({ name: 'azn' })
export class AznPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : `${format.format(value)} ₼`;
  }
}
