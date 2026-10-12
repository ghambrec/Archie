import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Settings } from './settings/settings';
import { Shell } from './shell/shell';
import { Login } from './auth/login/login';
import { adminGuard, authGuard, guestGuard } from './auth/auth-guard';
import { Profile } from './profile/profile';
import { DocPage } from './documents/doc-page/doc-page';
export const routes: Routes = [
	{
		path: 'login',
		component: Login,
		canActivate: [guestGuard],
		title: 'Login',
	},
	{
		path: '',
		component: Shell,
		canActivate: [authGuard],
		children: [
			{
				path: '',
				redirectTo: 'home',
				pathMatch: 'full',
			},
			{
				path: 'home',
				component: Home,
				title: 'Home',
			},
			{
				path: 'documents',
				component: DocPage,
				title: 'Documents',
			},
			{
				path: 'profile',
				component: Profile,
				title: 'Profile',
			},
		],
	},
	{
		path: '',
		component: Shell,
		canActivate: [authGuard, adminGuard],
		children: [
			{
				path: 'settings',
				component: Settings,
				title: 'Settings',
			}
		]
	}
];
