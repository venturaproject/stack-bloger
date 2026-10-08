import { MigrationInterface, QueryRunner } from 'typeorm';

export class EditorialEnhancements1714700000000 implements MigrationInterface {
  name = 'EditorialEnhancements1714700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "viewCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_posts_search" ON "posts" USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("excerpt", '') || ' ' || coalesce("content", '')))`);
    await queryRunner.query(`ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "notificationType" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "communicationEmails" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "securityEmails" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "mobileNotifications" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "displayItems" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_search"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "viewCount"`);
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "displayItems"`);
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "mobileNotifications"`);
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "securityEmails"`);
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "communicationEmails"`);
    await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "notificationType"`);
  }
}
