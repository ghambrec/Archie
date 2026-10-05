export interface AllowedFileType {
	mimeType: string;
	detectedMimeType: string | null;
	aiSupported: boolean;
}

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CFB = 'application/x-cfb';

export const ALLOWED_FILE_TYPES = new Map<string, AllowedFileType>([
	['txt',		{ mimeType: 'text/plain',				detectedMimeType: null,					aiSupported: true }],
	['pdf',		{ mimeType: 'application/pdf',			detectedMimeType: 'application/pdf',	aiSupported: true }],
	['png',		{ mimeType: 'image/png',				detectedMimeType: 'image/png',			aiSupported: true }],
	['jpg',		{ mimeType: 'image/jpeg',				detectedMimeType: 'image/jpeg',			aiSupported: true }],
	['jpeg',	{ mimeType: 'image/jpeg',				detectedMimeType: 'image/jpeg',			aiSupported: true }],
	['heic',	{ mimeType: 'image/heic',				detectedMimeType: 'image/heic',			aiSupported: true }],
	['docx',	{ mimeType: DOCX,						detectedMimeType: DOCX,					aiSupported: true }],
	['xlsx',	{ mimeType: XLSX,						detectedMimeType: XLSX,					aiSupported: true }],
	['doc',		{ mimeType: 'application/msword',		detectedMimeType: CFB,					aiSupported: false }],
	['xls',		{ mimeType: 'application/vnd.ms-excel',	detectedMimeType: 'application/x-cfb',	aiSupported: true }],
	['md',		{ mimeType: 'text/markdown',			detectedMimeType: null,					aiSupported: true }],
	['csv',		{ mimeType: 'text/csv',					detectedMimeType: null,					aiSupported: true }],
	['zip',		{ mimeType: 'application/zip',			detectedMimeType: 'application/zip',	aiSupported: false }],
]);
