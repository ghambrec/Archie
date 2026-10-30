import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';

// backend fehler zu transloco key
export function toErrorKey(err: HttpErrorResponse, transloco: TranslocoService): string {
	const code = err.error?.code;
	if (code) {
		const key = `errors.${code}`;
		const translation = transloco.getTranslation(transloco.getActiveLang());
		return key in translation ? key : 'errors.UNKNOWN';
	}
	return err.status === 403 ? 'errors.FORBIDDEN' : 'errors.UNKNOWN';
}
