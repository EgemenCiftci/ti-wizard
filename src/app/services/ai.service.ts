import { inject, Injectable } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly firebaseApp = inject(FirebaseApp);
  private readonly ai = getAI(this.firebaseApp, { backend: new GoogleAIBackend() });
  private readonly jsonSchema = Schema.object({
    properties: {
      questions: Schema.array({
        items: Schema.object({
          properties: {
            number: Schema.number(),
            content: Schema.string(),
            answerParts: Schema.array({
              items: Schema.object({
                properties: {
                  number: Schema.number(),
                  content: Schema.string(),
                  score: Schema.number(),
                }
              }),
            }),
          }
        }),
      }),
    }
  });
  // Free models as of December 2025: "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"
  private readonly jsonModel = getGenerativeModel(this.ai,
    {
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: this.jsonSchema
      }
    });

  async generateJson(prompt: string): Promise<string> {
    const result = await this.jsonModel.generateContent(prompt);
    const response = result.response;
    const json = response.text();
    console.log(json);
    return json;
  }

  async generateJsonWithMultipleFiles(files: File[], prompt: string): Promise<string> {
    const fileParts = await Promise.all(
      files.map(async (file) => ({
        inlineData: {
          data: await this.fileToBase64(file),
          mimeType: file.type,
        },
      }))
    );

    const result = await this.jsonModel.generateContent([
      ...fileParts,
      prompt,
    ]);

    const json = result.response.text();
    console.log(json);
    return json;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 part (remove data:image/png;base64, prefix)
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

}
