import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepper, MatStep, MatStepLabel, MatStepperNext, MatStepperPrevious } from '@angular/material/stepper';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { Item } from 'src/app/models/item';
import { OverviewData } from 'src/app/models/overview-data';
import { QuestionMaterial } from 'src/app/models/question-material';
import { ResultData } from 'src/app/models/result-data';
import { Scoring } from 'src/app/models/scoring';
import { Section } from 'src/app/models/section';
import { TaskScores } from 'src/app/models/task-scores';
import { FileService } from 'src/app/services/file.service';
import { SettingsService } from 'src/app/services/settings.service';
import { SnackBarService } from 'src/app/services/snack-bar.service';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';
import { DecimalPipe } from '@angular/common';
import { MatOption } from '@angular/material/core';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';
import { ScoreComponent } from '../score/score.component';
import { MatDivider } from '@angular/material/divider';
import { MatSelect } from '@angular/material/select';
import { MatChipListbox, MatChip } from '@angular/material/chips';

@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.css'],
  standalone: true,
  imports: [
    MatStepper,
    MatStep,
    MatStepLabel,
    MatButton,
    MatIcon,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    MatStepperNext,
    MatDatepickerInput,
    MatHint,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    ScoreComponent,
    MatDivider,
    MatStepperPrevious,
    MatSelect,
    MatIconButton,
    MatChipListbox,
    MatChip,
    DecimalPipe
  ]
})
export class WizardComponent implements OnInit, AfterViewInit, OnDestroy {
  private _formBuilder = inject(FormBuilder);
  settingsService = inject(SettingsService);
  private _fileService = inject(FileService);
  private _snackBarService = inject(SnackBarService);

  candidateNames: string[] = [];
  candidateName: string = '';
  tiDirectoryName?: string;
  questionMaterials: QuestionMaterial[] = [];
  isInUpdateMode = false;
  selectedTask?: string;
  taskItems?: Item[];
  sections?: Section[];
  scoring?: Scoring;
  taskScores?: TaskScores;
  candidateNameFormGroup = this._formBuilder.group({
    candidateName: ['', Validators.required]
  });
  overviewFormGroup = this._formBuilder.group({
    interviewerName: [this.settingsService.interviewerName],
    date: [new Date()],
    relevantExperience: [0]
  });
  taskFormGroup = this._formBuilder.group({});
  questionsFormGroup = this._formBuilder.group({});
  resultFormGroup = this._formBuilder.group({
    communication: [''],
    finalResultLevel: [''],
    overallImpression: ['Part of the overall feedback please include input for:\na.	Ability to code – based on questions on second tab\nb.	Ability to design and engineer – based on architecture questions, oop, patterns, etc.\nc.	Practical task results\nd.	Ability to perform in the project – understanding methodology/sdlc/estimation\ne.	Ability to communicate – knowing English, expressing thoughts']
  });
  handleTaskScoreSubject = new Subject<void>();
  handleTaskScoreSubscription?: Subscription;
  handleQuestionsScoreSubject = new Subject<void>();
  handleQuestionsScoreSubscription?: Subscription;

  ngOnInit() {
    this.candidateNameFormGroup.get('candidateName')?.valueChanges.subscribe(async val => {
      try {
        this.candidateName = val?.trim() ?? '';
        this.isInUpdateMode = this.candidateNames.includes(this.candidateName);
      } catch (error) {
        console.error(error);
        this._snackBarService.showSnackBar('Error while getting candidate data.');
      }
    });
  }

  ngAfterViewInit() {
    this.handleTaskScoreSubscription = this.handleTaskScoreSubject.asObservable().pipe(debounceTime(2000)).subscribe(async () => {
      await this.processTaskStep();
    });
    this.handleQuestionsScoreSubscription = this.handleQuestionsScoreSubject.asObservable().pipe(debounceTime(2000)).subscribe(async () => {
      await this.processQuestionsStep();
    });
  }

  ngOnDestroy() {
    this.handleTaskScoreSubscription?.unsubscribe();
    this.handleQuestionsScoreSubscription?.unsubscribe();
  }

  handleTaskScoreChange() {
    this.handleTaskScoreSubject.next();
  }

  handleQuestionsScoreChange() {
    this.handleQuestionsScoreSubject.next();
  }

  async selectTiDirectory(stepper: MatStepper) {
    try {
      await this._fileService.initialize();
      this.tiDirectoryName = this._fileService.tiDirectoryHandle?.name;
      this.candidateNames = await this._fileService.getCandidateNames();
      this.questionMaterials = await this._fileService.getQuestionMaterials();
      stepper.selectedIndex = 1;
    } catch (error) {
      this.tiDirectoryName = undefined;
      console.error(error);
      this._snackBarService.showSnackBar('Error while selecting TI directory.');
    }
  }

  async stepperSelectionChange(event: StepperSelectionEvent) {
    switch (event.previouslySelectedIndex) {
      case 1:
        await this.processCandidateNameStep();
        break;
      case 3:
        await this.processOverviewStep();
        break;
      case 7:
        await this.processResultStep();
        break;
    }
  }

  async processCandidateNameStep() {
    try {
      if (!this.candidateNameFormGroup?.valid) {
        return;
      }

      if (this.isInUpdateMode) {
        const overviewData = await this._fileService.getOverviewData(this.candidateName);
        this.updateOverviewForm(overviewData);
        const resultData = await this._fileService.getResultData(this.candidateName);
        this.updateResultForm(resultData);
      } else {
        await this._fileService.createCandidateFolderAndCopyInterviewFormFile(this.candidateName);
        this.candidateNames = await this._fileService.getCandidateNames();
        this.isInUpdateMode = this.candidateNames.includes(this.candidateName);
        await this._fileService.setCandidateName(this.candidateName);
        this._snackBarService.showSnackBar('Folder created successfully.');
      }

      this.sections = await this._fileService.getSections(this.candidateName);
      this.scoring = await this._fileService.getScoring(this.candidateName);
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while submitting candidate name.');
    }
  }

  async processOverviewStep() {
    try {
      if (!this.overviewFormGroup?.valid) {
        return;
      }

      await this._fileService.setOverview(this.candidateName, this.overviewFormGroup.value);
      this._snackBarService.showSnackBar('Submitted successfully.');
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while submitting overview.');
    }
  }

  async processTaskStep() {
    try {
      if (!this.taskFormGroup?.valid) {
        return;
      }

      await this._fileService.setTaskItems(this.candidateName, this.taskItems);
      this._snackBarService.showSnackBar('Submitted successfully.');

      this.taskScores = await this._fileService.getTaskScores(this.candidateName);
      await this._fileService.setTaskScore(this.candidateName, this.selectedTask, this.taskScores);
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while submitting task items.');
    }
  }

  async processQuestionsStep() {
    try {
      if (!this.questionsFormGroup?.valid) {
        return;
      }

      await this._fileService.setSections(this.candidateName, this.sections);
      this._snackBarService.showSnackBar('Submitted successfully.');

      await this._fileService.updateSectionScores(this.candidateName, this.sections);
      this.scoring = await this._fileService.getScoring(this.candidateName);
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while submitting task items.');
    }
  }

  async processResultStep() {
    try {
      if (!this.resultFormGroup?.valid) {
        return;
      }

      await this._fileService.setResult(this.candidateName, this.resultFormGroup.value, this.scoring);
      this._snackBarService.showSnackBar('Submitted successfully.');
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while submitting result.');
    }
  }

  private updateOverviewForm(overviewData: OverviewData) {
    this.overviewFormGroup.patchValue({
      interviewerName: overviewData.interviewerName,
      date: overviewData.date,
      relevantExperience: overviewData.relevantExperience
    });
  }

  private updateResultForm(resultData: ResultData) {
    this.resultFormGroup.patchValue({
      communication: resultData.communication,
      finalResultLevel: resultData.finalResultLevel,
      overallImpression: resultData.overallImpression
    });
  }

  async selectAspNetCoreCodeReview(stepper: MatStepper) {
    try {
      this.selectedTask = 'ASP.NET Core Code Review';
      const code = await this._fileService.getAspNetCoreCode();
      await this.selectCodeReview(stepper, code);
    } catch (error) {
      this.selectedTask = undefined;
      console.error(error);
      this._snackBarService.showSnackBar('Error while selecting task.');
    }
  }

  async selectWpfCodeReview(stepper: MatStepper) {
    try {
      this.selectedTask = 'WPF Code Review';
      const code = await this._fileService.getWpfCode();
      await this.selectCodeReview(stepper, code);
    } catch (error) {
      this.selectedTask = undefined;
      console.error(error);
      this._snackBarService.showSnackBar('Error while selecting task.');
    }
  }

  private async selectCodeReview(stepper: MatStepper, code: string) {
    await this.copyToClipboard(code);
    this._snackBarService.showSnackBar('Copied to clipboard');
    this.openWebsiteInNewTab();
    this.taskItems = await this._fileService.getTaskItems(this.candidateName, this.selectedTask);
    this.taskScores = await this._fileService.getTaskScores(this.candidateName);
    stepper.selectedIndex = 5;
  }

  private openWebsiteInNewTab() {
    window.open(this.settingsService.websiteUrl, "_blank");
  }

  private async copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  linkedInPeopleSearch() {
    try {
      const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(this.candidateName)}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while searching.');
    }
  }

  gitHubUserSearch() {
    try {
      const url = `https://github.com/search?q=${encodeURIComponent(this.candidateName)}&type=users`;
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while searching.');
    }
  }

  googleSearch() {
    try {
      const url = `https://www.google.com/search?q=${encodeURIComponent(this.candidateName)}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while searching.');
    }
  }

  reset(stepper: MatStepper) {
    stepper.reset();
    this.candidateName = '';
    this.isInUpdateMode = false;
    this.overviewFormGroup.reset();
    this.taskFormGroup.reset();
    this.questionsFormGroup.reset();
    this.resultFormGroup.reset();
    this.sections = [];
    this.taskItems = [];
    this.selectedTask = undefined;
    this.tiDirectoryName = undefined;
    this.candidateNames = [];
    this.questionMaterials = [];
    this.scoring = undefined;
  }

  getQuestionMaterial(row: number): QuestionMaterial | undefined {
    return this.questionMaterials.find(f => f.line === row);
  }

  async selectQuestionMaterial(row: number) {
    try {
      const qm = this.getQuestionMaterial(row);
      if (qm?.code) {
        await this.copyToClipboard(qm.code);
        this._snackBarService.showSnackBar('Copied to clipboard');
      }
    } catch (error) {
      console.error(error);
      this._snackBarService.showSnackBar('Error while copying code.');
    }
  }

  getTaskScore(selectedTask?: string): number | undefined {
    if (selectedTask === "ASP.NET Core Code Review") {
      return this.taskScores?.aspNetCoreScore;
    } else if (selectedTask === "WPF Code Review") {
      return this.taskScores?.wpfScore;
    } else {
      return undefined;
    }
  }

  addSentence(sentence: string) {
    this.resultFormGroup.value.overallImpression += `${sentence}\n`;
    this.resultFormGroup.patchValue({
      overallImpression: this.resultFormGroup.value.overallImpression
    });
  }
}
