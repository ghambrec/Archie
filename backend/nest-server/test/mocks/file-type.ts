// file-type is ESM-only and cannot be loaded by Jest (ts-jest/CommonJS).
// Unit tests mock DocumentFileValidationService, so a stub is enough here.
export const fileTypeFromBuffer = jest.fn().mockResolvedValue(undefined);
