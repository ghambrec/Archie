
import { Service, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

export interface Conversation {
	id:string;
	title: string | null;
	updated_at: string;
	created_at: string;
}

export interface ChatMessage {
	id:string;
	conv_id: string;
	sender: 'user' | 'llm';
	content:string;
	created_at:string;
}

export interface ListResponse<T> {
	count:number;
	data: T[];
}

export interface CreateConverationResponse {
	id:string
}

export interface DeleteConversation {
	id: string;
}


@Service()
export class AIChat {


	private readonly http = inject(HttpClient);
	
}