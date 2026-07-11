import { Component, signal } from '@angular/core';

@Component({
  selector: 'mr-storybook-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('enterprise-ui-storybook');
}
