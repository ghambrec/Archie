import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';
import { inject } from '@angular/core';
import { Users } from '../users/users';

// session nur pruefen wenn noch kein user geladen ist
// isLoggedIn false solange der passwortwechsel offen ist
async function isLoggedIn(): Promise<boolean> {
	const auth = inject(Auth);
	const usersService = inject(Users);

	if (!usersService.currentUser()) {
		await auth.checkSession();
	}
	return usersService.isLoggedIn();
}

export const authGuard: CanActivateFn = async () => {
	const router = inject(Router);

	if (await isLoggedIn()) {
		return true;
	}
	return router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = async () => {
	const router = inject(Router);

	if (!(await isLoggedIn())) {
		return true;
	}
	return router.parseUrl('/');
}

export const adminGuard: CanActivateFn = async () => {
	const router = inject(Router);
	const usersService = inject(Users);

	//check session, then role
	if (await isLoggedIn()) {
		if (usersService.isAdminUser()) {
			return true;
		}
		// User is logged in but not admin => regular UI
		return router.parseUrl('/');
	}
	// not logged in
	return router.parseUrl('/login');
}
