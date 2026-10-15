import { Component } from '@angular/core';
import { DocReview } from '../doc-review/doc-review';

@Component({
  selector: 'app-doc-page',
  imports: [DocReview],
  templateUrl: './doc-page.html',
  styleUrl: './doc-page.scss',
})
export class DocPage {}
