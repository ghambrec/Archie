import { Component, DestroyRef, Injector, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbModal, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DeleteChatModal } from '../delete-chat-modal/delete-chat-modal';
import type { Conversation } from '../chat.models';

@Component({
  selector: 'app-conversation-list',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem],
  templateUrl: './conversation-list.html',
  styleUrl: './conversation-list.scss',
})
export class ConversationList {
  private readonly modalService = inject(NgbModal);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly conversations = input.required<Conversation[]>();
  readonly isLoadingHistory = input(false);
  readonly historyError = input(false);
  readonly busy = input(false);
  readonly retry = output<void>();

  openDeleteModal(conversation: Conversation): void {
    if (this.busy()) return;
    const modal = this.modalService.open(DeleteChatModal, {
      injector: this.injector,
      centered: true,
      ariaLabelledBy: 'delete-chat-title',
      ariaDescribedBy: 'delete-chat-description',
      beforeDismiss: () => !modal.componentInstance.isDeleting(),
    });
    modal.componentInstance.selectedChat = conversation;
    modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((deletedId: string) => {
      const deletedChatUrl = this.router.createUrlTree(['/ai-chat', deletedId]);
      if (this.router.isActive(deletedChatUrl, {
        paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored',
      })) {
        void this.router.navigate(['/ai-chat']);
      }
    });
  }
}
