import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipInputEvent, MatChipGrid, MatChipRow, MatChipRemove, MatChipInput } from '@angular/material/chips';
import { SettingsService } from 'src/app/services/settings.service';
import { SnackBarService } from 'src/app/services/snack-bar.service';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { take } from 'rxjs';
import { Settings } from 'src/app/models/settings';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatChipGrid,
    CdkDropList,
    MatChipRow,
    CdkDrag,
    MatChipRemove,
    MatIcon,
    MatChipInput,
    MatButton
  ]
})
export class SettingsComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private snackBarService = inject(SnackBarService);
  form = this.formBuilder.group({
    interviewerName: [''],
    outputDirectory: ['', Validators.required],
    inputDirectory: ['', Validators.required],
    aspNetCoreCodeFileName: [''],
    wpfCodeFileName: [''],
    questionMaterialsFileName: [''],
    interviewFormFileName: [''],
    websiteUrl: [''],
    preformedSentences: [['']]
  });

  ngOnInit() {
    this.settingsService.settings$.pipe(take(1)).subscribe(settings =>
      this.form.patchValue({
        interviewerName: settings.interviewerName,
        outputDirectory: settings.outputDirectory,
        inputDirectory: settings.inputDirectory,
        aspNetCoreCodeFileName: settings.aspNetCoreCodeFileName,
        wpfCodeFileName: settings.wpfCodeFileName,
        questionMaterialsFileName: settings.questionMaterialsFileName,
        interviewFormFileName: settings.interviewFormFileName,
        websiteUrl: settings.websiteUrl,
        preformedSentences: settings.preformedSentences
      }));
  }

  save() {
    try {
      if (!this.form?.valid) {
        return;
      }

      const settings = new Settings();
      settings.interviewerName = this.form.value.interviewerName?.trim() ?? '';
      settings.outputDirectory = this.form.value.outputDirectory?.trim() ?? '';
      settings.inputDirectory = this.form.value.inputDirectory?.trim() ?? '';
      settings.aspNetCoreCodeFileName = this.form.value.aspNetCoreCodeFileName?.trim() ?? '';
      settings.wpfCodeFileName = this.form.value.wpfCodeFileName?.trim() ?? '';
      settings.questionMaterialsFileName = this.form.value.questionMaterialsFileName?.trim() ?? '';
      settings.interviewFormFileName = this.form.value.interviewFormFileName?.trim() ?? '';
      settings.websiteUrl = this.form.value.websiteUrl?.trim() ?? '';
      settings.preformedSentences = this.form.value.preformedSentences ?? [];
      this.settingsService.saveSettings(settings).pipe(take(1)).subscribe(() => this.snackBarService.showSnackBar('Settings saved successfully.'));
    } catch (error) {
      console.error(error);
      this.snackBarService.showSnackBar('Error while saving settings.');
    }
  }

  reset() {
    try {
      this.settingsService.resetSettings().pipe(take(1)).subscribe(() => this.snackBarService.showSnackBar('Settings reset successfully.'));
    } catch (error) {
      console.error(error);
      this.snackBarService.showSnackBar('Error while resetting settings.');
    }
  }

  addSentence(event: MatChipInputEvent) {
    const value = (event.value || '').trim();

    if (value) {
      this.form.get('preformedSentences')?.value?.push(value);
    }

    event.chipInput!.clear();
  }

  removeSentence(sentence: string) {
    const index = this.form.get('preformedSentences')?.value?.indexOf(sentence);

    if (index && index >= 0) {
      this.form.get('preformedSentences')?.value?.splice(index, 1);
    }
  }

  dropSentence(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.form.get('preformedSentences')?.value ?? [], event.previousIndex, event.currentIndex);
  }
}
