import { HttpClient, httpResource	 } from "@angular/common/http";

import { inject, type Signal} from "@angular/core";
import { Service } from "@angular/core";
import { environment } from "../../environments/environment";
import { type CreateConversationResponse, type AskConversationResponse, DeleteConversation } from "./chat.models";
import type { Conversation, ListResponse, ChatMessage } from "./chat.models";


@Service()
export class ConversationsService  {
	private readonly http = inject(HttpClient);

	private readonly baseUrl =
		`${environment.apiUrl}/conversations`;
	
	createConversation() {
		return this.http.post<CreateConversationResponse> (
			this.baseUrl,
			{},
			{withCredentials: true}
		)
	}

	conversationsResource() {
	return httpResource<ListResponse<Conversation>>(() => ({
		url: this.baseUrl,
		withCredentials: true,
	}));
	}

	ask(conversationId: string, question:string){
		return this.http.post<AskConversationResponse> (
			`${this.baseUrl}/${conversationId}/ask`,
			{question: question},
			{withCredentials: true}
		)
	}

	deleteConversation(conversationId: string){
		return this.http.delete<DeleteConversation> (
			`${this.baseUrl}/${conversationId}`,
			{withCredentials: true}
		)

	}
	messageResource(conversationId: Signal<string| null >){
		return httpResource<ListResponse<ChatMessage>>(() =>  {
			const id = conversationId();
			if(!id) 
				return undefined;
			return {
				url: `${this.baseUrl}/${id}/messages`,
				withCredentials: true, 
			};
		})
	}
	//patchConversationTitel(conversationId: string) {
	//	return this.http.patch<PatchConversation> (
	//		`${this.baseUrl}/${conversationId}/patch`,
	//		{withCredentials: true}
	//	)
	//}


	}

