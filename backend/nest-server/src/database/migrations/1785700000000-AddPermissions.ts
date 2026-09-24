import { MigrationInterface, QueryRunner } from 'typeorm';

const PERMISSION_KEYS: Array<{ permKey: string; description: string }> = [
  { permKey: 'admin', description: 'Full administrative access' },
  { permKey: 'documents.read', description: 'Read documents in a group' },
  { permKey: 'documents.upload', description: 'Upload documents to a group' },
  { permKey: 'documents.update', description: 'Update documents in a group' },
  { permKey: 'documents.delete', description: 'Delete documents in a group' },
];

export class AddPermissions1785700000000 implements MigrationInterface {
  name = 'AddPermissions1785700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { permKey, description } of PERMISSION_KEYS) {
      await queryRunner.query(
        `INSERT INTO "permissions" ("perm_key", "description") VALUES ($1, $2)
         ON CONFLICT ("perm_key") DO NOTHING`,
        [permKey, description],
      );
    }
	await queryRunner.query(
		`
		insert into user_permission (user_id, group_id, permission_id)
		select ug.user_id, ug.group_id, p.id
		from user_groups as ug
		inner join groups as g 
			on g.id = ug.group_id
		inner join permissions as p
			on p.perm_key = 'admin'
		where
			g.name = 'Admin'
		on conflict do nothing
		`
	);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "perm_key" = ANY($1)`,
      [PERMISSION_KEYS.map((p) => p.permKey)],
    );
  }
}
