import { Pipe, PipeTransform } from '@angular/core';
import { SUBJECTS } from '../../data/subjects';
const SUBJECT_MAP = new Map(SUBJECTS.map((s) => [s.id, s.name]));

@Pipe({
  name: 'subjectName',
  standalone: true,
})
export class SubjectNamePipe implements PipeTransform {
  transform(value: string | string[] | undefined | null): string {
    if (!value) return '';
    if (typeof value === 'string') {
      return SUBJECT_MAP.get(value) || value;
    }

    if (Array.isArray(value)) {
      return value.map((id) => SUBJECT_MAP.get(id) || id).join(', ');
    }

    return '';
  }
}
