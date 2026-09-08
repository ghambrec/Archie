import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTags1788784804408 implements MigrationInterface {
    name = 'CreateTags1788784804408';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS tags (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL UNIQUE,
                label VARCHAR(150) NOT NULL,
                description VARCHAR(500),
                facet VARCHAR(16) NOT NULL DEFAULT 'domain' 
                    CHECK (facet IN ('domain', 'doctype')),
                parent_id UUID REFERENCES tags(id) ON DELETE RESTRICT,
                is_system BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                CONSTRAINT no_self_parent 
                    CHECK (parent_id IS DISTINCT FROM id)
                )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS tags_parent_id_idx
            ON tags (parent_id);
            `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS document_tags (
                document_id UUID NOT NULL 
                    REFERENCES documents(id) ON DELETE CASCADE,
                
                tag_id UUID NOT NULL
                    REFERENCES tags(id) ON DELETE RESTRICT,
                
                assigned_by UUID 
                    REFERENCES users(id) ON DELETE SET NULL,  -- NULL = llm
                
                created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                
                PRIMARY KEY (document_id, tag_id)
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS document_tags_tag_id_idx
            ON document_tags (tag_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP table if exists "document_tags"
        `);

        await queryRunner.query(`
            DROP table if exists "tags"
        `);

    }
    

}
