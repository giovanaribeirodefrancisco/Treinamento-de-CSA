// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { HttpClientModule } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(HttpClientModule), ...appConfig.providers]
})
  .catch((err) => console.error(err));

