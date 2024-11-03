import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';
import * as Excel from 'exceljs';
import { CellValue, HyperFormula } from 'hyperformula';
import { QuestionMaterial } from '../models/question-material';
import { MappingsService } from './mappings.service';
import { Item } from '../models/item';
import { Section } from '../models/section';
import { Scoring } from '../models/scoring';
import { ScoreResult } from '../models/score-result';
import { Sheet, Sheets } from 'hyperformula/typings/Sheet';
import { RawCellContent } from 'hyperformula/typings/CellContentParser';
import { OverviewData } from '../models/overview-data';
import { ResultData } from '../models/result-data';
import { TaskScores } from '../models/task-scores';
import { take, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private settingsService = inject(SettingsService);
  private mappingsService = inject(MappingsService);

  tiDirectoryHandle?: FileSystemDirectoryHandle;
  outputDirectoryHandle?: FileSystemDirectoryHandle;
  inputDirectoryHandle?: FileSystemDirectoryHandle;
  aspNetCoreCodeFileHandle?: FileSystemFileHandle;
  wpfCodeFileHandle?: FileSystemFileHandle;
  questionMaterialsFileHandle?: FileSystemFileHandle;
  interviewFormFileHandle?: FileSystemFileHandle;

  async initialize() {
    await this.getTiDirectoryHandle();
    this.settingsService.settings$.pipe(take(1), tap(async (settings) => {
      this.outputDirectoryHandle = await this.getDirectoryHandle(this.tiDirectoryHandle, settings.outputDirectory, true);
      this.inputDirectoryHandle = await this.getDirectoryHandle(this.tiDirectoryHandle, settings.inputDirectory);
      this.aspNetCoreCodeFileHandle = await this.getFileHandle(this.inputDirectoryHandle, settings.aspNetCoreCodeFileName);
      this.wpfCodeFileHandle = await this.getFileHandle(this.inputDirectoryHandle, settings.wpfCodeFileName);
      this.questionMaterialsFileHandle = await this.getFileHandle(this.inputDirectoryHandle, settings.questionMaterialsFileName);
      this.interviewFormFileHandle = await this.getFileHandle(this.inputDirectoryHandle, settings.interviewFormFileName);
    }));
  }

  private async getTiDirectoryHandle() {
    this.tiDirectoryHandle = await (window as any).showDirectoryPicker({ startIn: 'documents' });
  }

  private async getSubDirectoryNames(handle: FileSystemDirectoryHandle | undefined): Promise<string[]> {
    const subDirectoryNames: string[] = [];

    if (handle) {
      for await (const [name, fileHandle] of (handle as any)) {
        if (fileHandle.kind === 'directory') {
          subDirectoryNames.push(name);
        }
      }
    }

    return subDirectoryNames;
  }

  async getCandidateNames(): Promise<string[]> {
    return await this.getSubDirectoryNames(this.outputDirectoryHandle);
  }

  private async getFileHandle(handle: FileSystemDirectoryHandle | undefined, fileName: string, createIfNotExists = false): Promise<FileSystemFileHandle | undefined> {
    return await handle?.getFileHandle(fileName, { create: createIfNotExists });
  }

  private async getDirectoryHandle(handle: FileSystemDirectoryHandle | undefined, directoryName: string, createIfNotExists = false): Promise<FileSystemDirectoryHandle | undefined> {
    return await handle?.getDirectoryHandle(directoryName, { create: createIfNotExists });
  }

  async createCandidateFolderAndCopyInterviewFormFile(candidateName: string) {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, true);
    const fileData = await this.readFromFile(this.interviewFormFileHandle);
    await this.writeToFile(handle, fileData);
  }

  private async readFromFile(fileHandle: FileSystemFileHandle | undefined): Promise<File> {
    if (!fileHandle) {
      throw new Error('File handle is undefined');
    }

    return await fileHandle.getFile();
  }

  private async writeToFile(fileHandle: FileSystemFileHandle | undefined, data: any) {
    if (!fileHandle) {
      throw new Error('File handle is undefined');
    }

    const writableStream = await (fileHandle as any).createWritable();
    await writableStream.write(data);
    await writableStream.close();
  }

  async getOverviewData(candidateName: string): Promise<OverviewData> {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    if (!fileData) {
      throw new Error('File data is undefined');
    }

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.overview.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    const overviewData = new OverviewData();
    const relevantExperience = Number(worksheet.getCell(this.mappingsService.mappings.overview.relevantExperienceCell).value);
    overviewData.relevantExperience = relevantExperience ? relevantExperience : undefined;
    overviewData.interviewerName = String(worksheet.getCell(this.mappingsService.mappings.overview.interviewerNameCell).value);
    overviewData.date = new Date(String(worksheet.getCell(this.mappingsService.mappings.overview.dateCell).value));

    return overviewData;
  }

  async getResultData(candidateName: string): Promise<ResultData> {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    if (!fileData) {
      throw new Error('File data is undefined');
    }

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.overview.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    const resultData = new ResultData();
    resultData.communication = String(worksheet.getCell(this.mappingsService.mappings.overview.communicationCell).value);
    resultData.finalResultLevel = String(worksheet.getCell(this.mappingsService.mappings.overview.finalResultLevelCell).value);
    resultData.overallImpression = String(worksheet.getCell(this.mappingsService.mappings.overview.overallImpressionCell).value);

    return resultData;
  }

  private async readAsText(fileHandle: FileSystemFileHandle | undefined): Promise<string> {
    return (await this.readFromFile(fileHandle))?.text() ?? '';
  }

  async getAspNetCoreCode(): Promise<string> {
    return await this.readAsText(this.aspNetCoreCodeFileHandle);
  }

  async getWpfCode(): Promise<string> {
    return await this.readAsText(this.wpfCodeFileHandle);
  }

  async getQuestionMaterials(): Promise<QuestionMaterial[]> {
    const questionMaterials: QuestionMaterial[] = [];
    const questionMaterialsText = await this.readAsText(this.questionMaterialsFileHandle);
    const regex = /line (?<line>\d+?)\r\n\r\n(?<code>.*?)\r\n\r\n/gs;
    [...questionMaterialsText.matchAll(regex)].forEach((match) => {
      const qm = new QuestionMaterial();
      qm.line = Number(match.groups?.['line']);
      qm.code = match.groups?.['code'];
      questionMaterials.push(qm);
    });

    return questionMaterials;
  }

  private async getCandidateInterviewFormFileHandle(candidateName: string, createIfNotExists: boolean): Promise<FileSystemFileHandle | undefined> {
    const candidateDirectoryHandle = await this.getDirectoryHandle(this.outputDirectoryHandle, candidateName, createIfNotExists);
    let handle: FileSystemFileHandle | undefined;

    try {
      const fileName = `${candidateName} - Interview Form.xlsx`;
      handle = await candidateDirectoryHandle?.getFileHandle(fileName, { create: createIfNotExists });
    } catch {
      try {
        this.settingsService.settings$.pipe(take(1), tap(async (settings) => {
          handle = await candidateDirectoryHandle?.getFileHandle(settings.interviewFormFileName, { create: createIfNotExists });
        }));
      } catch {
        try {
          const oldFileName = `${candidateName} - Interview Form CS template 0.8.xlsx`;
          handle = await candidateDirectoryHandle?.getFileHandle(oldFileName, { create: createIfNotExists });
        } catch {
          handle = undefined;
        }
      }
    } finally {
      return handle;
    }
  }

  async getTaskItems(candidateName: string, selectedTask: string | undefined): Promise<Item[]> {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    if (fileData) {
      const workbook = new Excel.Workbook();
      await workbook.xlsx.load(fileData as any);
      const worksheet = workbook.getWorksheet(this.mappingsService.mappings.tasks.worksheetName);

      if (!worksheet) {
        throw new Error('Worksheet is null!');
      }

      let rows: number[];
      switch (selectedTask) {
        case 'ASP.NET Core Code Review':
          rows = this.mappingsService.mappings.tasks.aspNetCoreCommentRows;
          break;
        case 'WPF Code Review':
          rows = this.mappingsService.mappings.tasks.wpfCommentRows;
          break;
        default:
          return [];
      }

      const items = rows.map(row => {
        const item = new Item();
        item.question = String(worksheet.getCell(`${this.mappingsService.mappings.tasks.questionColumn}${row}`).value);
        item.scoreCell = `${this.mappingsService.mappings.tasks.scoreColumn}${row}`;
        item.totalScoreCell = `${this.mappingsService.mappings.tasks.totalScoreColumn}${row}`;
        const score = Number(worksheet.getCell(item.scoreCell).value);
        item.score = score ? score : undefined;
        return item;
      });

      return items;
    }

    return [];
  }

  async getSections(candidateName: string): Promise<Section[]> {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    if (fileData) {
      const workbook = new Excel.Workbook();
      await workbook.xlsx.load(fileData as any);
      const worksheet = workbook.getWorksheet(this.mappingsService.mappings.csQuestions.worksheetName);

      if (!worksheet) {
        throw new Error('Worksheet is null!');
      }

      const sheets = this.getSheets(workbook);
      const csQuestions = this.mappingsService.mappings.csQuestions;
      const sections = this.mappingsService.mappings.csQuestions.sections.map(section => {
        const sectionData = new Section();
        sectionData.title = String(worksheet.getCell(`${csQuestions.questionColumn}${section.titleRow}`).value);
        sectionData.suddenDeathItems = section.suddenDeath?.rows?.map(row => {
          const item = new Item();
          item.question = String(worksheet.getCell(`${csQuestions.questionColumn}${row}`).value);
          item.answer = String(worksheet.getCell(`${csQuestions.answerColumn}${row}`).value);
          item.scoreCell = `${csQuestions.scoreColumn}${row}`;
          item.row = row;
          const score = Number(worksheet.getCell(item.scoreCell).value);
          item.score = score ? score : undefined;
          return item;
        });
        sectionData.mandatoryItems = section.mandatary?.rows?.map(row => {
          const item = new Item();
          item.question = String(worksheet.getCell(`${csQuestions.questionColumn}${row}`).value);
          item.answer = String(worksheet.getCell(`${csQuestions.answerColumn}${row}`).value);
          item.scoreCell = `${csQuestions.scoreColumn}${row}`;
          item.row = row;
          const score = Number(worksheet.getCell(item.scoreCell).value);
          item.score = score ? score : undefined;
          return item;
        });
        sectionData.juniorItems = section.junior.rows?.map(row => {
          const item = new Item();
          item.question = String(worksheet.getCell(`${csQuestions.questionColumn}${row}`).value);
          item.answer = String(worksheet.getCell(`${csQuestions.answerColumn}${row}`).value);
          item.scoreCell = `${csQuestions.scoreColumn}${row}`;
          item.row = row;
          const score = Number(worksheet.getCell(item.scoreCell).value);
          item.score = score ? score : undefined;
          return item;
        });
        sectionData.regularItems = section.regular.rows?.map(row => {
          const item = new Item();
          item.question = String(worksheet.getCell(`${csQuestions.questionColumn}${row}`).value);
          item.answer = String(worksheet.getCell(`${csQuestions.answerColumn}${row}`).value);
          item.scoreCell = `${csQuestions.scoreColumn}${row}`;
          item.row = row;
          const score = Number(worksheet.getCell(item.scoreCell).value);
          item.score = score ? score : undefined;
          return item;
        });
        sectionData.seniorItems = section.senior.rows?.map(row => {
          const item = new Item();
          item.question = String(worksheet.getCell(`${csQuestions.questionColumn}${row}`).value);
          item.answer = String(worksheet.getCell(`${csQuestions.answerColumn}${row}`).value);
          item.scoreCell = `${csQuestions.scoreColumn}${row}`;
          item.row = row;
          const score = Number(worksheet.getCell(item.scoreCell).value);
          item.score = score ? score : undefined;
          return item;
        });

        sectionData.juniorScoreCell = `${csQuestions.scoreColumn}${section.junior.scoreRow}`;
        sectionData.regularScoreCell = `${csQuestions.scoreColumn}${section.regular.scoreRow}`;
        sectionData.seniorScoreCell = `${csQuestions.scoreColumn}${section.senior.scoreRow}`;

        this.updateScores(sectionData, worksheet, sheets);

        return sectionData;
      });

      return sections;
    }

    return [];
  }

  async updateSectionScores(candidateName: string, sections?: Section[]) {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.csQuestions.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    const sheets = this.getSheets(workbook);

    sections?.forEach(section => {
      this.updateScores(section, worksheet, sheets);
    });
  }

  private updateScores(sectionData: Section, worksheet: Excel.Worksheet, sheets: Sheets) {
    const sectionScores = this.getSectionScores(sectionData, worksheet, sheets);
    sectionData.juniorScore = sectionScores.juniorScore;
    sectionData.regularScore = sectionScores.regularScore;
    sectionData.seniorScore = sectionScores.seniorScore;
  }

  async setCandidateName(candidateName: string) {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.overview.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    worksheet.getCell(this.mappingsService.mappings.overview.candidateNameCell).value = candidateName;

    await this.writeToFile(handle, await workbook.xlsx.writeBuffer());
  }

  async setOverview(candidateName: string, overview: any) {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.overview.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    worksheet.getCell(this.mappingsService.mappings.overview.interviewerNameCell).value = overview.interviewerName;
    worksheet.getCell(this.mappingsService.mappings.overview.dateCell).value = overview.date?.toDateString();
    worksheet.getCell(this.mappingsService.mappings.overview.relevantExperienceCell).value = overview.relevantExperience ? overview.relevantExperience : undefined;

    await this.writeToFile(handle, await workbook.xlsx.writeBuffer());
  }

  async setResult(candidateName: string, result: any, scoring?: Scoring) {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.overview.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    worksheet.getCell(this.mappingsService.mappings.overview.communicationCell).value = result.communication;
    worksheet.getCell(this.mappingsService.mappings.overview.finalResultLevelCell).value = result.finalResultLevel;
    worksheet.getCell(this.mappingsService.mappings.overview.overallImpressionCell).value = result.overallImpression;

    if (scoring) {
      const finalResultLevel = result.finalResultLevel.toLowerCase();
      if (finalResultLevel === 'junior') {
        worksheet.getCell(this.mappingsService.mappings.overview.finalResultScoreCell).value = scoring.junior?.score ? scoring.junior?.score : undefined;
      } else if (finalResultLevel === 'regular') {
        worksheet.getCell(this.mappingsService.mappings.overview.finalResultScoreCell).value = scoring.regular?.score ? scoring.regular?.score : undefined;
      } else if (finalResultLevel === 'senior') {
        worksheet.getCell(this.mappingsService.mappings.overview.finalResultScoreCell).value = scoring.senior?.score ? scoring.senior?.score : undefined;
      }
    }

    await this.writeToFile(handle, await workbook.xlsx.writeBuffer());
  }

  async setTaskItems(candidateName: string, taskItems?: Item[]) {
    if (!taskItems) {
      throw new Error('Task items are not defined');
    }

    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.tasks.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    taskItems.forEach(item => {
      worksheet.getCell(item.scoreCell).value = item.score ? item.score : undefined;
    });

    // update total scores // DOES NOT WORK
    /*     const sheets = this.getSheets(workbook);
        taskItems.forEach(item => {
          const totalScoreCell = worksheet.getCell(item.totalScoreCell);
          (totalScoreCell.value as any).result = Number(this.evaluateFormula(this.mappingsService.mappings.tasks.worksheetName, totalScoreCell.formula, sheets));
        }); */

    await this.writeToFile(handle, await workbook.xlsx.writeBuffer());
  }

  async getTaskScores(candidateName: string): Promise<TaskScores> {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.tasks.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    const sheets = this.getSheets(workbook);
    const aspNetCoreScoreCellFormula = worksheet.getCell(`${this.mappingsService.mappings.tasks.scoreColumn}${this.mappingsService.mappings.tasks.aspNetScoreRow}`).formula;
    const aspNetCoreScore = Number(this.evaluateFormula(this.mappingsService.mappings.tasks.worksheetName, aspNetCoreScoreCellFormula, sheets));
    const wpfScoreCellFormula = worksheet.getCell(`${this.mappingsService.mappings.tasks.scoreColumn}${this.mappingsService.mappings.tasks.wpfScoreRow}`).formula;
    const wpfScore = Number(this.evaluateFormula(this.mappingsService.mappings.tasks.worksheetName, wpfScoreCellFormula, sheets));

    const taskScores = new TaskScores();
    taskScores.aspNetCoreScore = aspNetCoreScore;
    taskScores.wpfScore = wpfScore;

    return taskScores;
  }

  async setTaskScore(candidateName: string, selectedTask: string | undefined, taskScores: TaskScores) {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.csQuestions.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    let score: number | undefined = undefined;
    if (selectedTask === 'ASP.NET Core Code Review') {
      score = taskScores.aspNetCoreScore;
    } else if (selectedTask === 'WPF Code Review') {
      score = taskScores.wpfScore;
    }

    if (score && score >= 1 && score <= 4) {
      worksheet.getCell(this.mappingsService.mappings.csQuestions.codeReviewScoreCell).value = score;
    } else {
      worksheet.getCell(this.mappingsService.mappings.csQuestions.codeReviewScoreCell).value = undefined;
    }

    await this.writeToFile(handle, await workbook.xlsx.writeBuffer());
  }

  private getSectionScores(sectionData: Section, worksheet: Excel.Worksheet, sheets: Sheets): { juniorScore?: number, regularScore?: number, seniorScore?: number } {
    const juniorScoreFormula = worksheet.getCell(sectionData.juniorScoreCell!).formula;
    let juniorScore: number | undefined = Number(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, juniorScoreFormula, sheets));
    juniorScore = juniorScore ? juniorScore : undefined;

    const regularScoreFormula = worksheet.getCell(sectionData.regularScoreCell!).formula;
    let regularScore: number | undefined = Number(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, regularScoreFormula, sheets));
    regularScore = regularScore ? regularScore : undefined;

    const seniorScoreFormula = worksheet.getCell(sectionData.seniorScoreCell!).formula;
    let seniorScore: number | undefined = Number(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, seniorScoreFormula, sheets));
    seniorScore = seniorScore ? seniorScore : undefined;

    return { juniorScore, regularScore, seniorScore };
  }

  async setSections(candidateName: string, sections?: Section[]) {
    if (!sections) {
      throw new Error("Sections are not defined");
    }

    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.csQuestions.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    sections.forEach(section => {
      section.suddenDeathItems?.forEach(item => worksheet.getCell(item.scoreCell).value = item.score ? item.score : undefined);
      section.mandatoryItems?.forEach(item => worksheet.getCell(item.scoreCell).value = item.score ? item.score : undefined);
      section.juniorItems?.forEach(item => worksheet.getCell(item.scoreCell).value = item.score ? item.score : undefined);
      section.regularItems?.forEach(item => worksheet.getCell(item.scoreCell).value = item.score ? item.score : undefined);
      section.seniorItems?.forEach(item => worksheet.getCell(item.scoreCell).value = item.score ? item.score : undefined);
    });

    await this.writeToFile(handle, await workbook.xlsx.writeBuffer());
  }

  async getScoring(candidateName: string): Promise<Scoring> {
    const handle = await this.getCandidateInterviewFormFileHandle(candidateName, false);
    const fileData = await this.readFromFile(handle);

    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(fileData as any);
    const worksheet = workbook.getWorksheet(this.mappingsService.mappings.csQuestions.worksheetName);

    if (!worksheet) {
      throw new Error('Worksheet is null!');
    }

    const sheets = this.getSheets(workbook);
    const scoring = new Scoring();

    scoring.junior = new ScoreResult();
    const juniorScoreCellFormula = worksheet.getCell(this.mappingsService.mappings.csQuestions.juniorScoreCell).formula;
    scoring.junior.score = Number(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, juniorScoreCellFormula, sheets));
    const juniorResultCellFormula = worksheet.getCell(this.mappingsService.mappings.csQuestions.juniorResultCell).formula;
    scoring.junior.result = String(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, juniorResultCellFormula, sheets));

    scoring.regular = new ScoreResult();
    const regularScoreCellFormula = worksheet.getCell(this.mappingsService.mappings.csQuestions.regularScoreCell).formula;
    scoring.regular.score = Number(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, regularScoreCellFormula, sheets));
    const regularResultCellFormula = worksheet.getCell(this.mappingsService.mappings.csQuestions.regularResultCell).formula;
    scoring.regular.result = String(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, regularResultCellFormula, sheets));

    scoring.senior = new ScoreResult();
    const seniorScoreCellFormula = worksheet.getCell(this.mappingsService.mappings.csQuestions.seniorScoreCell).formula;
    scoring.senior.score = Number(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, seniorScoreCellFormula, sheets));
    const seniorResultCellFormula = worksheet.getCell(this.mappingsService.mappings.csQuestions.seniorResultCell).formula;
    scoring.senior.result = String(this.evaluateFormula(this.mappingsService.mappings.csQuestions.worksheetName, seniorResultCellFormula, sheets));

    return scoring;
  }

  private evaluateFormula(sheetName: string, formula: string, sheets: Sheets): CellValue | CellValue[][] {
    const hf = HyperFormula.buildFromSheets(sheets, { licenseKey: 'gpl-v3' });
    const sheetId = hf.getSheetId(sheetName);
    if (sheetId === undefined) {
      throw new Error(`Sheet ${sheetName} is not found`);
    }
    return hf.calculateFormula(`=${formula}`, sheetId);
  }

  private getSheets(workbook: Excel.Workbook): Sheets {
    const sheets: Sheets = {};

    workbook.eachSheet(worksheet => {
      if (worksheet.state === 'hidden') {
        return;
      }

      const sheetData: Sheet = new Array<Array<RawCellContent>>();

      worksheet.eachRow({ includeEmpty: true }, row => {
        const rowData: RawCellContent[] = [];

        row.eachCell({ includeEmpty: true }, cell => {
          let cellData: RawCellContent;
          switch (cell.type) {
            case Excel.ValueType.Formula:
              cellData = `=${cell.formula}`;
              break;
            case Excel.ValueType.Number:
            case Excel.ValueType.String:
            case Excel.ValueType.Date:
            case Excel.ValueType.Hyperlink:
            case Excel.ValueType.SharedString:
              cellData = cell.value as RawCellContent;
              break;
            default:
              cellData = undefined;
              break;
          }

          rowData.push(cellData);
        });

        sheetData.push(rowData);
      });

      sheets[worksheet.name] = sheetData;
    });

    return sheets;
  }
}
