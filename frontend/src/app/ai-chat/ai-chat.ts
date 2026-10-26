import { Component, computed, DestroyRef, effect, Injector, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { chatErrorKey } from './chat-errors';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConversationsService } from './conversations.service';
import { ChatMessageList } from './chat-message-list/chat-message-list';
import { ChatComposer } from './chat-composer/chat-composer';
import { DeleteChatModal } from './delete-chat-modal/delete-chat-modal';
import { DeleteAllChatsModal } from './delete-all-chats-modal/delete-all-chats-modal';

@Component({
  selector: 'app-ai-chat',
  imports: [TranslocoPipe, ChatMessageList, ChatComposer],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
})
export class AIChat {
  private readonly conversationService = inject(ConversationsService);
  private readonly modalService = inject(NgbModal);
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  private activeRequest: Subject<void> | undefined;
  private draftConversationId: string | null = null;

  readonly activeConversationId = computed(() => this.routeParams().get('id'));
  readonly draft = signal('');
  readonly isCreatingConversation = signal(false);
  readonly createConversationError = signal<string | null>(null);
  readonly isSending = signal(false);
  readonly sendError = signal<string | null>(null);
  readonly isDeleting = signal(false);
  readonly messageResource = this.conversationService.messageResource(this.activeConversationId);
  readonly messages = computed(() => {
    if (this.messageResource.hasValue()) return this.messageResource.value().data;
    return [];
  });
  readonly isOpeningConversation = this.messageResource.isLoading;
  readonly openConversationError = computed(() =>
    this.messageResource.error() ? 'ai-chat.history.openError' : null
  );

  readonly isBusy = computed(() => this.busy());

  readonly canDeleteAll = computed(() =>
    !this.busy() && (this.conversationService.conversations().length > 0 || this.activeConversationId() !== null)
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelActiveRequest());
    effect(() => {
      this.activeConversationId();
      this.cancelActiveRequest();
      this.draftConversationId = null;
      this.draft.set('');
      this.sendError.set(null);
      this.createConversationError.set(null);
    });
  }

  private cancelActiveRequest(): void {
    this.activeRequest?.next();
    this.activeRequest?.complete();
    this.activeRequest = undefined;
  }

  private busy(): boolean {
    return this.conversationService.isMutating() || this.isSending() ||
      this.isCreatingConversation() || this.isDeleting() || this.isOpeningConversation();
  }

  async send(): Promise<void> {
    const question = this.draft().trim();
    if (this.busy() || !question) return;
    const selectedId = this.activeConversationId();
    let conversationId = selectedId ?? this.draftConversationId;
    this.sendError.set(null);
    this.isSending.set(true);
    const cancelled = new Subject<void>();
    this.activeRequest = cancelled;
    try {
      if (!conversationId) {
        const conversation = await firstValueFrom(this.conversationService.createConversation().pipe(takeUntil(cancelled)));
        conversationId = conversation.id;
        this.draftConversationId = conversation.id;
      }
      if (this.destroyRef.destroyed || this.activeRequest !== cancelled) return;
      await firstValueFrom(this.conversationService.ask(conversationId, question).pipe(takeUntil(cancelled)));
      if (this.destroyRef.destroyed || this.activeConversationId() !== selectedId) return;
      this.draft.set('');
      if (selectedId) {
        this.messageResource.reload();
      } else {
        await this.router.navigate(['/ai-chat', conversationId]);
      }
    } catch (error) {
      if (!this.destroyRef.destroyed && this.activeRequest === cancelled && this.activeConversationId() === selectedId) {
        this.sendError.set(chatErrorKey(error));
        this.conversationService.conversationsResource.reload();
        if (selectedId) this.messageResource.reload();
      }
    } finally {
      if (this.activeRequest === cancelled) this.activeRequest = undefined;
      cancelled.complete();
      this.isSending.set(false);
    }
  }

  async startNewChat(): Promise<void> {
    if (this.busy()) return;
    this.isCreatingConversation.set(true);
    this.createConversationError.set(null);
    try {
      const conversation = await firstValueFrom(this.conversationService.createConversation());
      if (!this.destroyRef.destroyed) await this.router.navigate(['/ai-chat', conversation.id]);
    } catch {
      this.createConversationError.set('ai-chat.error.createConversation');
    } finally {
      this.isCreatingConversation.set(false);
    }
  }

  deleteAllChats(): void {
    if (!this.canDeleteAll()) return;
    const modal = this.modalService.open(DeleteAllChatsModal, {
      injector: this.injector,
      centered: true,
      ariaLabelledBy: 'delete-all-chats-title',
      ariaDescribedBy: 'delete-all-chats-description',
      beforeDismiss: () => !modal.componentInstance.isDeleting(),
    });
    this.isDeleting.set(true);
    modal.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isDeleting.set(false);
    });
    modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.draft.set('');
      this.sendError.set(null);
      this.createConversationError.set(null);
      void this.router.navigate(['/ai-chat']);
    });
  }

  deleteChat(): void {
    const id = this.activeConversationId();
    if (!id || this.busy()) return;
    const conversation = this.conversationService.conversations().find(chat => chat.id === id);
    const modal = this.modalService.open(DeleteChatModal, {
      injector: this.injector,
      centered: true,
      ariaLabelledBy: 'delete-chat-title',
      ariaDescribedBy: 'delete-chat-description',
      beforeDismiss: () => !modal.componentInstance.isDeleting(),
    });
    modal.componentInstance.selectedChat = conversation ?? { id, title: null };
    this.isDeleting.set(true);
    modal.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isDeleting.set(false);
    });
    modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((deletedId: string) => {
      if (this.activeConversationId() === deletedId) {
        void this.router.navigate(['/ai-chat']);
      }
    });
  }
}
