import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Settings } from './settings/settings';
import { Shell } from './shell/shell';
import { Login } from './auth/login/login';

export const routes: Routes = [
	{
		path: 'login',
		component: Login,
		title: 'Login',
	},
	{
		path: '',
		component: Shell,
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
				path: 'settings',
				component: Settings,
				title: 'Settings',
			},
		],
	},
];
