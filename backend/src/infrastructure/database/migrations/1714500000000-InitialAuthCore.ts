import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAuthCore1714500000000 implements MigrationInterface {
  name = 'InitialAuthCore1714500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "username" character varying(100),
        "emailVerifiedAt" TIMESTAMP,
        "password" character varying NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "rememberToken" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "guardName" character varying(25) NOT NULL DEFAULT 'web',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "guardName" character varying(25) NOT NULL DEFAULT 'web',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_settings" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "avatar" character varying,
        "theme" character varying,
        "font" character varying,
        "language" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_settings_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_user_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_settings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "model_has_roles" (
        "model_id" integer NOT NULL,
        "role_id" integer NOT NULL,
        CONSTRAINT "PK_model_has_roles" PRIMARY KEY ("model_id", "role_id"),
        CONSTRAINT "FK_model_has_roles_model_id" FOREIGN KEY ("model_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_model_has_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "model_has_permissions" (
        "model_id" integer NOT NULL,
        "permission_id" integer NOT NULL,
        CONSTRAINT "PK_model_has_permissions" PRIMARY KEY ("model_id", "permission_id"),
        CONSTRAINT "FK_model_has_permissions_model_id" FOREIGN KEY ("model_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_model_has_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_has_permissions" (
        "permission_id" integer NOT NULL,
        "role_id" integer NOT NULL,
        CONSTRAINT "PK_role_has_permissions" PRIMARY KEY ("permission_id", "role_id"),
        CONSTRAINT "FK_role_has_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_has_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_refresh_tokens" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "token" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_user_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_has_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "model_has_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "model_has_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
