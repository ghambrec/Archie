import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-login',
  imports: [TranslocoPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {}
