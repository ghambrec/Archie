import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Service, signal, type Signal } from '@angular/core';
import { defer, finalize, tap, type Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { CreateConversationResponse, AskConversationResponse, DeleteConversation,
  Conversation, ListResponse, ChatMessage } from './chat.models';

@Service()
export class ConversationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/conversations`;
  private readonly pendingMutations = signal(0);
  readonly isMutating = computed(() => this.pendingMutations() > 0);

  readonly conversationsResource = httpResource<ListResponse<Conversation>>(() => ({
    url: this.baseUrl,
    withCredentials: true,
  }));

  readonly conversations = computed(() => {
    if (!this.conversationsResource.hasValue()) return [];
    return [...this.conversationsResource.value().data].sort(
      (a, b) => b.updated_at.localeCompare(a.updated_at)
    );
  });

  private mutate<T>(request: Observable<T>): Observable<T> {
    return defer(() => {
      this.pendingMutations.update(count => count + 1);
      return request.pipe(
        tap(() => this.conversationsResource.reload()),
        finalize(() => this.pendingMutations.update(count => count - 1)),
      );
    });
  }

  createConversation() {
    return this.mutate(this.http.post<CreateConversationResponse>(
      this.baseUrl, {}, { withCredentials: true }
    ));
  }

  ask(conversationId: string, question: string) {
    return this.mutate(this.http.post<AskConversationResponse>(
      `${this.baseUrl}/${conversationId}/ask`, { question }, { withCredentials: true }
    ));
  }

  renameConversation(conversationId: string, title: string) {
    return this.mutate(this.http.patch<Conversation>(
      `${this.baseUrl}/${conversationId}`, { title }, { withCredentials: true }
    ));
  }

  deleteConversation(conversationId: string) {
    return this.mutate(this.http.delete<DeleteConversation>(
      `${this.baseUrl}/${conversationId}`, { withCredentials: true }
    ));
  }

  deleteAllConversations() {
    return this.mutate(this.http.delete<void>(
      this.baseUrl, { withCredentials: true }
    ));
  }

  messageResource(conversationId: Signal<string | null>) {
    return httpResource<ListResponse<ChatMessage>>(() => {
      const id = conversationId();
      if (!id) return undefined;
      return { url: `${this.baseUrl}/${id}/messages`, withCredentials: true };
    });
  }
}
