import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async () => {
	const auth = inject(Auth);
	const router = inject(Router);

	if (auth.currentUser() || (await auth.checkSession())) {
		return true;
	}
	return router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = async () => {
	const auth = inject(Auth);
	const router = inject(Router);

	if (!auth.currentUser() && !(await auth.checkSession())) {
		return true;
	}
	return router.parseUrl('/home');
}

export const adminGuard: CanActivateFn = async () => {
	const auth = inject(Auth);
	const router = inject(Router);

	//check session, then role
	if (auth.currentUser() || await auth.checkSession()) {
		if (auth.isAdmin()) {
			return true;
		}
		// User is logged in but not admin => regular UI 
		return router.parseUrl('/home');
	}
	// not logged in
	return router.parseUrl('/login');
}