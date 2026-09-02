import { Component, inject, OnInit, signal } from "@angular/core";
import { AdminGroupsService, Group } from "./admin-groups.service";

@Component({
  selector: 'app-admin-groups',
  templateUrl: './admin-groups.html',
  styleUrl: './admin-groups.scss',
})
export class AdminGroups implements OnInit {
  private readonly service = inject(AdminGroupsService);
  groups = signal<Group[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.service.getAll().subscribe(g => this.groups.set(g));
  }

  deleteGroup(id: string) {
    this.service.delete(id).subscribe(() => this.load());
  }

  //additional endpoints
}