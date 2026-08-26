import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1785163997067 implements MigrationInterface {
  name = 'InitSchema1785163997067';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "display_name" varchar NOT NULL,
        "avatar_object_key" varchar,
        "preferred_language" varchar NOT NULL DEFAULT 'en',
        "is_active" boolean NOT NULL DEFAULT true,
        "email_verified_at" timestamptz,
        "last_login_at" timestamptz,
        "last_seen_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "groups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "description" varchar,
        "is_system" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_groups" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_groups_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "perm_key" varchar NOT NULL,
        "description" varchar,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_perm_key" UNIQUE ("perm_key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_groups" (
        "user_id" uuid NOT NULL,
        "group_id" uuid NOT NULL,
        "invited_by" uuid,
        "joined_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_groups" PRIMARY KEY ("user_id", "group_id"),
        CONSTRAINT "FK_user_groups_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_groups_group" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_groups_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_permission" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "group_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_user_permission" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_permission_user_group_permission" UNIQUE ("user_id", "group_id", "permission_id"),
        CONSTRAINT "FK_user_permission_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_permission_group" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_permission_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "uploaded_by" uuid NOT NULL,
        "filename" varchar NOT NULL,
        "mime_type" varchar NOT NULL,
        "object_key" varchar NOT NULL,
        "size_bytes" bigint NOT NULL,
        "sha256" varchar NOT NULL,
        "page_count" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "PK_documents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_documents_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_groups" (
        "document_id" uuid NOT NULL,
        "group_id" uuid NOT NULL,
        CONSTRAINT "PK_document_groups" PRIMARY KEY ("document_id", "group_id"),
        CONSTRAINT "FK_document_groups_document" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_document_groups_group" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "document_groups"`);
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TABLE "user_permission"`);
    await queryRunner.query(`DROP TABLE "user_groups"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
