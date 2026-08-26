import { MigrationInterface, QueryRunner } from 'typeorm';

const PERMISSION_KEYS: Array<{ permKey: string; description: string }> = [
  { permKey: 'documents.read', description: 'Read documents in a group' },
  { permKey: 'documents.upload', description: 'Upload documents to a group' },
  { permKey: 'documents.update', description: 'Update documents in a group' },
  { permKey: 'documents.delete', description: 'Delete documents in a group' },
  {
    permKey: 'group.manage_users',
    description: 'Add or remove members of a group',
  },
  { permKey: 'group.update', description: 'Rename or edit a group' },
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "perm_key" = ANY($1)`,
      [PERMISSION_KEYS.map((p) => p.permKey)],
    );
  }
}
