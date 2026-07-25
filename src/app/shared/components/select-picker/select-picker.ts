import { Component, computed, input, output, signal } from '@angular/core';

export interface SelectPickerOption {
  readonly value: string;
  readonly label: string;
  readonly detail?: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-select-picker',
  templateUrl: './select-picker.html',
  styleUrl: './select-picker.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class SelectPicker {
  readonly value = input('');
  readonly options = input.required<readonly SelectPickerOption[]>();
  readonly sheetTitle = input('Choose an option');
  readonly placeholder = input('Choose an option');
  readonly disabled = input(false);
  readonly valueChange = output<string>();
  readonly open = signal(false);
  readonly selectedOption = computed(() =>
    this.options().find((option) => option.value === this.value()),
  );

  show(): void {
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  select(value: string): void {
    this.valueChange.emit(value);
    this.close();
  }
}
