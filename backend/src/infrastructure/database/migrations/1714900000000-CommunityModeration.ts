import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommunityModeration1714900000000 implements MigrationInterface {
  name = 'CommunityModeration1714900000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'approved'`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_post_comments_status" ON "post_comments" ("status")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "post_bookmarks" ("id" SERIAL NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_post_bookmarks_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_post_bookmarks_user_post" UNIQUE ("post_id", "user_id"), CONSTRAINT "FK_post_bookmarks_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE, CONSTRAINT "FK_post_bookmarks_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "post_bookmarks"`);
    await queryRunner.query(`ALTER TABLE "post_comments" DROP COLUMN IF EXISTS "status"`);
  }
}
