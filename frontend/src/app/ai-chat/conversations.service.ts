import { HttpClient } from "@angular/common/http";

import { inject, signal} from "@angular/core";
import { Service } from "@angular/core";
import { environment } from "../../environments/environment";
import type { CreateConversationResponse } from "./chat.models";



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
	}

