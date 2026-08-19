import { TranslocoPipe } from '@jsverse/transloco';
import { Groups } from '../groups';
import { computed, OnInit, inject, Component, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateGroupModal } from '../create-group-modal/create-group-modal';


@Component({
  selector: 'app-group-list',
  imports: [TranslocoPipe],
  templateUrl: './group-list.html',
  styleUrl: './group-list.scss',
})
export class GroupList implements OnInit {
  protected readonly groupsService = inject(Groups);
  protected readonly hasLoadError = signal(false);
  protected readonly searchString = signal("");
  protected readonly modalService = inject(NgbModal);

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
  protected readonly filteredGroupList = computed(() => {
    const searchStringGroups = this.searchString().trim().toLowerCase();
    
    return this.groupsService.groupsList().filter((groups) => {
      groups.name.trim().toLowerCase().includes(searchStringGroups);
      groups.description?.trim().toLowerCase().includes(searchStringGroups);
    });
  });
  openCreateGroupModal(): void {
    const modal = this.modalService.open(
      CreateGroupModal,
      {centered: true},
    )
  modal.closed.subscribe(() => {
    this.loadGroups();
  }

  )
  };




}
