import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Settings } from './settings/settings';
import { Shell } from './shell/shell';
import { Login } from './auth/login/login';
import { adminGuard, authGuard, guestGuard } from './auth/auth-guard';
import { Profile } from './profile/profile';
import { Documents } from './documents/documents';
// import { AdminShell } from './admin/admin-shell/admin-shell';
// // import { AdminUsers } from './admin/admin-users.ts/admin-user'; 
// import { AdminGroups } from './admin/admin-groups/admin-groups';
// import { AdminHome } from './admin/admin-home/admin-home';
// import { AdminSettings } from './admin/admin-settings/admin-settings';

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
				component: Documents,
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
	// {
	// 	path: 'admin',
	// 	component: AdminShell,
	// 	canActivate: [authGuard, adminGuard],
	// 	children: [
	// 		{
	// 			path: '',
	// 			redirectTo: 'admin-home',
	// 			pathMatch: 'full',
	// 		},
	// 		{
	// 			path: 'admin-home',
	// 			component: AdminHome,
	// 			title: 'Admin Home',
	// 		},
	// 		// {
	// 		// 	path: 'users',
	// 		// 	component: AdminUsers
	// 		// },
	// 		{
	// 			path: 'groups',
	// 			component: AdminGroups
	// 		},
	// 		// { 
	// 		// 	path: 'settings',
	// 		// 	component: AdminSettings
	// 		// },
	// 	],
	// }
];
