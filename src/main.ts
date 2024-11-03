import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app/app-routing.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';

const firebaseConfig = {
    apiKey: "AIzaSyC1LpqHF9hln6kdhwbT2QvhD3eVG19g_s0",
    authDomain: "ti-wizard.firebaseapp.com",
    databaseURL: "https://ti-wizard-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ti-wizard",
    storageBucket: "ti-wizard.firebasestorage.app",
    messagingSenderId: "501660150159",
    appId: "1:501660150159:web:77e8da9acb0dd49d50c3fa",
    measurementId: "G-TWZWHDN4YB"
};

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(
            BrowserModule,
            FormsModule,
            ReactiveFormsModule,
            AppRoutingModule,
            MatCheckboxModule,
            MatProgressBarModule,
            MatToolbarModule,
            MatButtonModule,
            MatFormFieldModule,
            MatAutocompleteModule,
            MatDatepickerModule,
            MatInputModule,
            MatNativeDateModule,
            MatSnackBarModule,
            MatIconModule,
            MatCardModule,
            MatSelectModule,
            MatStepperModule,
            MatSliderModule,
            MatDividerModule,
            MatRadioModule,
            MatTooltipModule,
            MatListModule,
            MatChipsModule,
            DragDropModule,
            MatMenuModule
        ),
        provideAnimations(),
        provideFirebaseApp(() => initializeApp(firebaseConfig)),
        provideAuth(() => getAuth()),
        provideDatabase(() => getDatabase()),
        // provideFirebaseApp(() => initializeApp({"projectId":"ti-wizard","appId":"1:501660150159:web:77e8da9acb0dd49d50c3fa","storageBucket":"ti-wizard.appspot.com","locationId":"europe-west","apiKey":"AIzaSyC1LpqHF9hln6kdhwbT2QvhD3eVG19g_s0","authDomain":"ti-wizard.firebaseapp.com","messagingSenderId":"501660150159","measurementId":"G-TWZWHDN4YB"})), 
    ]
}).catch(err => console.error(err));

