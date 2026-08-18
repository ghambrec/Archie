import { TranslocoPipe } from '@jsverse/transloco';
import { Groups } from '../groups';
import { OnInit, inject, Component, signal } from '@angular/core';


@Component({
  selector: 'app-group-list',
  imports: [TranslocoPipe],
  templateUrl: './group-list.html',
  styleUrl: './group-list.scss',
})
export class GroupList implements OnInit {
  protected readonly groupsService = inject(Groups);
  protected readonly hasLoadError = signal(false);

  ngOnInit():void {
    this.loadGroups();
  }

  private loadGroups(): void {
	this.hasLoadError.set(false);

    this.groupsService.getGroups().subscribe({
      next: groups => {
        this.groupsService.groupsList.set(groups)
      },
      //logger?
      error: (error) => {
		console.error('Unable to load groups', error);
		this.hasLoadError.set(true);
	  },
    });
  }
}
