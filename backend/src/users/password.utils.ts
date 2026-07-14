import { hash, verify } from "@node-rs/argon2";

export function hashPassword(plainPassword: string): Promise<string>
{
	return hash(plainPassword);
}

export function verifyPassword(hashPassword: string, plainPassword: string): Promise<boolean>
{
	return verify(hashPassword, plainPassword);
}
