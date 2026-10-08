import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostEngagement1714800000000 implements MigrationInterface {
  name = 'PostEngagement1714800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "post_comments" ("id" SERIAL NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_post_comments_id" PRIMARY KEY ("id"), CONSTRAINT "FK_post_comments_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE, CONSTRAINT "FK_post_comments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_post_comments_post_created" ON "post_comments" ("post_id", "createdAt")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "post_reactions" ("id" SERIAL NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "type" character varying(20) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_post_reactions_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_post_reactions_user_post_type" UNIQUE ("post_id", "user_id", "type"), CONSTRAINT "FK_post_reactions_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE, CONSTRAINT "FK_post_reactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_post_reactions_post" ON "post_reactions" ("post_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "post_reactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_comments"`);
  }
}
