import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogTables1714600000000 implements MigrationInterface {
  name = 'BlogTables1714600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "description" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tags" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tags_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_tags_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "posts" (
        "id" SERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "excerpt" text,
        "featuredImage" character varying,
        "status" character varying(20) NOT NULL DEFAULT 'draft',
        "publishedAt" TIMESTAMP,
        "author_id" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_posts_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_posts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_posts_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_posts_status" ON "posts" ("status");
      CREATE INDEX IF NOT EXISTS "IDX_posts_published_at" ON "posts" ("publishedAt");
      CREATE INDEX IF NOT EXISTS "IDX_posts_author_id" ON "posts" ("author_id");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_categories" (
        "post_id" integer NOT NULL,
        "category_id" integer NOT NULL,
        CONSTRAINT "PK_post_categories" PRIMARY KEY ("post_id", "category_id"),
        CONSTRAINT "FK_post_categories_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_post_categories_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_tags" (
        "post_id" integer NOT NULL,
        "tag_id" integer NOT NULL,
        CONSTRAINT "PK_post_tags" PRIMARY KEY ("post_id", "tag_id"),
        CONSTRAINT "FK_post_tags_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_post_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "post_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
