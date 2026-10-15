import { Pipe, PipeTransform } from '@angular/core';

const UNITS = ['B', 'KB', 'MB', 'GB'];

@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
	transform(bytes: number): string {
		let size = bytes;
		let unit = 0;
		while (size >= 1024 && unit < UNITS.length - 1) {
			size /= 1024;
			unit++;
		}
		return `${size.toFixed(unit === 0 ? 0 : 1)} ${UNITS[unit]}`;
	}
}
