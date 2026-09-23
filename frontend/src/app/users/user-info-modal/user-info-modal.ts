import { Component, inject, signal } from "@angular/core";
import { TranslocoPipe } from "@jsverse/transloco";
import { UserGroupsResponse, UserInfo } from "../users";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { httpResource } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Component({
  selector: 'app-user-info-modal',
  imports: [TranslocoPipe],
  templateUrl: './user-info-modal.html',
  styleUrl: './user-info-modal.scss',
})
export class UserInfoModal {
  readonly selectedUser = signal<UserInfo | null>(null);

  protected readonly activeModal = inject(NgbActiveModal);

  readonly memberships = httpResource<UserGroupsResponse>(
	() => {
		const user = this.selectedUser();
		return user
			? { url: `${environment.apiUrl}/user-groups/userId/${user.id}/groups`, withCredentials: true }
			: undefined;
	}
  );

  closeModal(): void {
    this.activeModal.dismiss();
  }
}
