import { Routes } from '@angular/router';
import { Settings } from './settings/settings';
import { Shell } from './shell/shell';
import { Login } from './auth/login/login';
import { adminGuard, authGuard, guestGuard } from './auth/auth-guard';
// import { Profile } from './profile/profile';
import { DocPage } from './documents/doc-page/doc-page';
import { AIChat } from './ai-chat/ai-chat';

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
				redirectTo: 'documents',
				pathMatch: 'full',
			},
			{
				path: 'documents',
				loadComponent: () =>
        			import('./documents/doc-page/doc-page').then((m) => m.DocPage),
				title: 'Documents',
			},
			{
				path: 'ai-chat',
				component: AIChat,
				title: 'AI Chat',
			},
			{
				path: 'ai-chat/:id',
				component: AIChat,
				title: 'AI Chat',
			},
			{
				path: 'profile',
				loadComponent: () =>
					import('./profile/profile').then((m) => m.Profile),
				title: 'Profile',
			},
			{
				path: 'settings',
				component: Settings,
				canActivate: [adminGuard],
				title: 'Settings'
			}
		],
	},
	{
		path: '**',
		redirectTo: ''
	}
];
