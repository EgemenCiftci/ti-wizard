import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatRadioChange, MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.css'],
  standalone: true,
  imports: [
    MatRadioGroup,
    FormsModule,
    MatRadioButton,
    MatIconButton,
    MatSuffix,
    MatIcon
  ]
})
export class ScoreComponent {
  @Input() values = [-1, 1, 2, 3, 4];
  classes = ["red", "orange", "yellow", "green", "blue"];
  private _selectedValue?: number;
  @Output() selectedValueChange = new EventEmitter<number | undefined>(); // emits on every change
  @Output() change = new EventEmitter<MatRadioChange>(); // emits only on user interaction

  @Input()
  get selectedValue(): number | undefined {
    return this._selectedValue;
  }

  set selectedValue(val: number | undefined) {
    if (val !== this.selectedValue) {
      this._selectedValue = val;
      this.selectedValueChange.emit(this._selectedValue);
    }
  }

  getClass(value: number): string {
    if (value < 2) {
      return this.classes[0];
    } else {
      switch (value) {
        case 2:
          return this.classes[1];
        case 3:
          return this.classes[2];
        case 4:
          return this.classes[3];
        default:
          return this.classes[4];
      }
    }
  }

  onChange($event: MatRadioChange) {
    this.change.emit($event);
  }

  clear() {
    this.selectedValue = undefined;
    this.onChange({ value: undefined } as MatRadioChange);
  }
}

