import { hashPassword, verifyPassword } from "../users/password.utils";

async function main()
{
	const plainPassword = 'TestPasswort123';

	const hashed = await hashPassword(plainPassword);
	console.log('Gehashed Passwort: ', hashed);

	const correct = await verifyPassword(hashed, plainPassword);
	console.log('Richtiges Passwort erkannt?', correct);

	const wrong = await verifyPassword(hashed, 'anderesPasswort');
	console.log('Falsches Passwort erkannt? ', wrong);
}

main();
