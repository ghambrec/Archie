import { Component } from '@angular/core';
import { DocReview } from '../doc-review/doc-review';
import { DocList } from '../doc-list/doc-list';

@Component({
  selector: 'app-doc-page',
  imports: [DocReview, DocList],
  templateUrl: './doc-page.html',
  styleUrl: './doc-page.scss',
})
export class DocPage {}
