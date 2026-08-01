import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPermissions1785601468268 implements MigrationInterface {
  name = 'SeedPermissions1785601468268';

  private readonly permissions: Array<{
    permKey: string;
    description: string;
  }> = [
    { permKey: 'documents.read', description: 'Read documents' },
    { permKey: 'documents.upload', description: 'Upload documents' },
    { permKey: 'documents.delete', description: 'Delete documents' },
    { permKey: 'groups.manage', description: 'Manage groups' },
    {
      permKey: 'group_permissions.manage',
      description: 'Manage group permissions',
    },
    { permKey: 'user_groups.manage', description: 'Manage group membership' },
    { permKey: 'users.manage', description: 'Manage users' },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const permission of this.permissions) {
      await queryRunner.query(
        `INSERT INTO "permissions" ("perm_key", "description") VALUES ($1, $2)`,
        [permission.permKey, permission.description],
      );
    }

    await queryRunner.query(
      `INSERT INTO "groups" ("name", "description", "is_system") VALUES ($1, $2, $3)`,
      ['Admin', 'Full access to all permissions', true],
    );

    await queryRunner.query(`
      INSERT INTO "group_permission" ("group_id", "permission_id")
      SELECT g.id, p.id
      FROM "groups" g
      CROSS JOIN "permissions" p
      WHERE g.name = 'Admin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "group_permission"
      WHERE "group_id" IN (SELECT "id" FROM "groups" WHERE "name" = 'Admin')
    `);
    await queryRunner.query(`DELETE FROM "groups" WHERE "name" = 'Admin'`);
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "perm_key" IN (${this.permissions
        .map((_, i) => `$${i + 1}`)
        .join(', ')})`,
      this.permissions.map((p) => p.permKey),
    );
  }
}
