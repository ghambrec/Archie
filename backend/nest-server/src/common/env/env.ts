export function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export function getEnvNumber(
  key: string,
  defaultValue: number
  ): number {
  const value = process.env[key];
  if(value == undefined || value?.trim() ==  '' )
    return defaultValue;
  const parsed = Number(value);
  
  if(!Number.isInteger(parsed))
    throw new Error ( ` env error:  " ${value} " musst be a number`); 
  return value ? parsed : defaultValue;
}

export function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value == undefined || value.trim() =='' )
      return defaultValue
  const parsed = value.trim().toLocaleLowerCase();
  if(parsed.trim().toLowerCase() !== 'true' && parsed.trim().toLowerCase() !== 'false')
    throw new Error (` env error ${value}, need to be a boolean`);
  return parsed === 'true';
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} environment variable is not set`);
  }
  return value;
}
