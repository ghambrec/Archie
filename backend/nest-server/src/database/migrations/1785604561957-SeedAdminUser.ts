import * as bcrypt from 'bcrypt';
import { MigrationInterface, QueryRunner } from 'typeorm';

const PASSWORD_SALT_ROUNDS = 10;

export class SeedAdminUser1785604561957 implements MigrationInterface {
  name = 'SeedAdminUser1785604561957';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const email = process.env.ADMIN_USER;
    const password = process.env.ADMIN_USER_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'ADMIN_USER and ADMIN_USER_PASSWORD env vars must be set to run this migration',
      );
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    await queryRunner.query(
      `
        INSERT INTO "users" ("email", "password_hash", "display_name")
        VALUES ($1, $2, 'Admin')
        ON CONFLICT ("email") DO UPDATE SET "password_hash" = EXCLUDED."password_hash"
      `,
      [email.trim().toLowerCase(), passwordHash],
    );

    await queryRunner.query(
      `
        INSERT INTO "user_groups" ("user_id", "group_id")
        SELECT u.id, g.id
        FROM "users" u
        CROSS JOIN "groups" g
        WHERE u.email = $1 AND g.name = 'Admin'
        ON CONFLICT ("user_id", "group_id") DO NOTHING
      `,
      [email.trim().toLowerCase()],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const email = process.env.ADMIN_USER;
    if (!email) {
      return;
    }

    await queryRunner.query(
      `
        DELETE FROM "user_groups"
        WHERE "user_id" = (SELECT "id" FROM "users" WHERE "email" = $1)
      `,
      [email.trim().toLowerCase()],
    );
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [
      email.trim().toLowerCase(),
    ]);
  }
}
