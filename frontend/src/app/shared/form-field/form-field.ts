import { Component, computed, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-form-field',
  imports: [FormField, TranslocoPipe],
  templateUrl: './form-field.html',
  styles: [':host { display: block; }'],
})
export class TextFormField {
  readonly field = input.required<FieldTree<string>>();
  readonly inputId = input.required<string>();
  readonly labelKey = input.required<string>();
  readonly type = input<'text' | 'email' | 'password'>('text');
  readonly autocomplete = input<string | null>(null);
  readonly hintKey = input<string | null>(null);

  protected readonly showError = computed(() => this.field()().touched() && this.field()().invalid());
  protected readonly errorKey = computed(() => this.field()().errors().find(error => error.message)?.message);
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hintKey()) ids.push(`${this.inputId()}-hint`);
    if (this.showError() && this.errorKey()) ids.push(`${this.inputId()}-error`);
    return ids.length ? ids.join(' ') : null;
  });
}
