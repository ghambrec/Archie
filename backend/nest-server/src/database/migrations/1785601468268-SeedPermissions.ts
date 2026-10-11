import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPermissions1785601468268 implements MigrationInterface {
  name = 'SeedPermissions1785601468268';

  public async up(queryRunner: QueryRunner): Promise<void> {
	const adminGroupName = process.env.ADMIN_GROUP?.trim() || 'admin';

    await queryRunner.query(
      `INSERT INTO "groups" ("name", "description", "is_system") VALUES ($1, $2, $3)`,
      [adminGroupName, 'Full access to all permissions', true],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "groups" WHERE "is_system" = true`);
  }
}
