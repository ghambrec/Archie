import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMustChangePassword1792584000000 implements MigrationInterface {
  name = 'AddMustChangePassword1792584000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "must_change_password" boolean NOT NULL DEFAULT false
    `);
    // Preserve the previous password-change requirement for existing accounts.
    await queryRunner.query(`
      UPDATE "users"
      SET "must_change_password" = ("last_login_at" IS NULL)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "must_change_password"`);
  }
}
