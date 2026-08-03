import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Translation, TranslocoLoader } from "@jsverse/transloco"
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
	private http = inject(HttpClient);

	getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
		return this.http.get<Translation>(`/i18n/${lang}.json`)
	}
}
