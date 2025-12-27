import { inject, Injectable } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly firebaseApp = inject(FirebaseApp);
  private readonly ai = getAI(this.firebaseApp, { backend: new GoogleAIBackend() });
  // Free models as of December 2025: "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"
  private readonly model = getGenerativeModel(this.ai, { model: "gemini-2.5-pro" });

  async generateText(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log(text);
    return text;
  }
}
