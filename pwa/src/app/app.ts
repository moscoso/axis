import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiPreferencesService } from './core/services/ui-preferences.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('axis-pwa');

  // Instantiate so the saved UI scale is applied to <html> on startup.
  private readonly uiPreferences = inject(UiPreferencesService);
}
