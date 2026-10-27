export interface AllowedFileType {
	mimeType: string;
	detectedMimeType: string | null;
	aiSupported: boolean;
	previewable: boolean;
}

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ODT = 'application/vnd.oasis.opendocument.text';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CFB = 'application/x-cfb';

export const ALLOWED_FILE_TYPES = new Map<string, AllowedFileType>([
	['txt',		{ mimeType: 'text/plain',				detectedMimeType: null,					aiSupported: true,		previewable: true }],
	['pdf',		{ mimeType: 'application/pdf',			detectedMimeType: 'application/pdf',	aiSupported: true,		previewable: true }],
	['png',		{ mimeType: 'image/png',				detectedMimeType: 'image/png',			aiSupported: true,		previewable: true }],
	['jpg',		{ mimeType: 'image/jpeg',				detectedMimeType: 'image/jpeg',			aiSupported: true,		previewable: true }],
	['jpeg',	{ mimeType: 'image/jpeg',				detectedMimeType: 'image/jpeg',			aiSupported: true,		previewable: true }],
	['heic',	{ mimeType: 'image/heic',				detectedMimeType: 'image/heic',			aiSupported: true,		previewable: false }],
	['docx',	{ mimeType: DOCX,						detectedMimeType: DOCX,					aiSupported: true,		previewable: false }],
	['odt',		{ mimeType: ODT,						detectedMimeType: ODT,					aiSupported: true,		previewable: false }],
	['xlsx',	{ mimeType: XLSX,						detectedMimeType: XLSX,					aiSupported: true,		previewable: false }],
	['doc',		{ mimeType: 'application/msword',		detectedMimeType: CFB,					aiSupported: false,		previewable: false }],
	['xls',		{ mimeType: 'application/vnd.ms-excel',	detectedMimeType: 'application/x-cfb',	aiSupported: true,		previewable: false }],
	['md',		{ mimeType: 'text/markdown',			detectedMimeType: null,					aiSupported: true,		previewable: true }],
	['csv',		{ mimeType: 'text/csv',					detectedMimeType: null,					aiSupported: true,		previewable: true }],
	['zip',		{ mimeType: 'application/zip',			detectedMimeType: 'application/zip',	aiSupported: false,		previewable: false }],
]);

export const FILENAME_MAX_LENGTH = 255;
export const FILENAME_FALLBACK = 'file';
export const FILENAME_CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g; // new lines, tabs, etc

export const PREVIEWABLE_MIME_TYPES = new Set([...ALLOWED_FILE_TYPES.values()].filter((type) => type.previewable).map((type) => type.mimeType));
