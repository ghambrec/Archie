import { Component, computed, DestroyRef, inject, signal} from '@angular/core';
import { UserInfo, Users } from '../users';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateUserModal } from '../create-user-modal/create-user-modal';
import { EditUserModal } from '../edit-user-modal/edit-user-modal';
import { UserInfoModal } from '../user-info-modal/user-info-modal';
import { Groups } from '../../groups/groups';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DeleteUserModal } from '../delete-user-modal/delete-user-modal';
import { RestoreUserModal } from '../restore-user-modal/restore-user-modal';
import { UserTable } from '../user-table/user-table';
import { DeletedUserList } from '../deleted-user-list/deleted-user-list';


@Component({
	selector: 'app-user-list',
	imports: [TranslocoPipe, UserTable, DeletedUserList],
	templateUrl: './user-list.html',
	styleUrl: './user-list.scss',
})
export class UserList {
	protected readonly usersService = inject(Users);
	private readonly modalService = inject(NgbModal);
	private readonly groupsService = inject(Groups);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly userAvatarUrl = (userId: string) => this.usersService.getAvatarUrl(userId);

	protected readonly searchString = signal("");
  protected readonly showDeleted = signal(false);
  protected readonly deletedUsers = this.usersService.deletedUsersResource(this.showDeleted);
  private readonly displayedResource = computed(() =>
    this.showDeleted() ? this.deletedUsers : this.usersService.users
  );
  protected readonly isLoadingList = computed(() => this.displayedResource().isLoading());
  protected readonly listError = computed(() => this.displayedResource().error());


	protected readonly filteredUserList = computed(() => {
    const resource = this.displayedResource();
		if (!resource.hasValue()) {
			return [];
		}
		const searchStringLowercased = this.searchString().toLowerCase();
		return resource.value().filter((user) =>
			user.displayName.toLowerCase().includes(searchStringLowercased) ||
			user.email.toLowerCase().includes(searchStringLowercased)
		)
	});

	openCreateUserModal(): void{ 
		const modal = this.modalService.open(
			CreateUserModal, 
			{ centered: true},
		);

		modal.closed.subscribe(() => {
			this.usersService.users.reload();
			this.groupsService.groups.reload();
		});
	}

	openEditUserModal(user: UserInfo): void {
		const modal = this.modalService.open(EditUserModal, 
			{ centered: true });
		
		modal.componentInstance.initialize(user);
		modal.closed.subscribe(() => {
			this.usersService.users.reload()
		})
	}

  openDeleteUserModal(user: UserInfo): void {
    const modal = this.modalService.open(DeleteUserModal, {
      centered: true,
      ariaLabelledBy: 'delete-user-title',
      ariaDescribedBy: 'delete-user-description',
      beforeDismiss: () => !modal.componentInstance.isDeleting(),
    });
    modal.componentInstance.selectedUser = user;
    modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.reloadUserLists();
    });
  }

  protected reloadDisplayedList(): void {
    this.displayedResource().reload();
  }

  private reloadUserLists(): void {
    this.usersService.users.reload();
    this.deletedUsers.reload();
    this.groupsService.groups.reload();
  }

  openRestoreUserModal(user: UserInfo): void {
    if (!this.showDeleted()) return;
    const modal = this.modalService.open(RestoreUserModal, {
      centered: true,
      ariaLabelledBy: 'restore-user-title',
      ariaDescribedBy: 'restore-user-description',
      beforeDismiss: () => !modal.componentInstance.isRestoring(),
    });
    modal.componentInstance.selectedUser = user;
    modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.reloadUserLists();
    });
  }

	openUserInfoModal(user: UserInfo): void {
		const modal = this.modalService.open(
			UserInfoModal,
			{
				centered: true,
				size: 'lg',
			});
		modal.componentInstance.selectedUser.set(user);
	}
}
