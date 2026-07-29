import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Settings } from './settings/settings';

export const routes: Routes = [
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
];
