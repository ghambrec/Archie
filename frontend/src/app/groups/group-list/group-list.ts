import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Groups } from '../groups';


//@Component({
//  selector: 'app-group-list',
//  imports: [TranslocoPipe],
//  templateUrl: './group-list.html',
//  styleUrl: './group-list.scss',
//})
//export class GroupList implements OnInit {
//  protected readonly groupsService = inject(Groups):

//  ngOnInit():void {
//    this.loadGroups(),
//  }

//  private loadGroups(): void {
//    this.groupsService.getGroups().subscribe({
//      next: Groups => {
//        this.groupsService.groupsList.set(Groups)
//      }
//      //logger?
//      //error:
//    })
//  }
//}
