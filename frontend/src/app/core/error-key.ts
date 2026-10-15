import { HttpErrorResponse } from '@angular/common/http';

// backend fehler zu transloco key
export function toErrorKey(err: HttpErrorResponse): string {
	const code = err.error?.code;
	if (code) {
		return `errors.${code}`;
	}
	return err.status === 403 ? 'errors.FORBIDDEN' : 'errors.UNKNOWN';
}
