import { Pipe, PipeTransform } from '@angular/core';
import { formatTimestamp } from '../utils/date-format.util';

@Pipe({
  name: 'timestamp',
  standalone: true,
  pure: true
})
export class TimestampPipe implements PipeTransform {
  transform(value: Date | string | null | undefined): string {
    return formatTimestamp(value);
  }
}