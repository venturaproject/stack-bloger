import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApiClients1715000000000 implements MigrationInterface {
  name = 'ApiClients1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "api_clients" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "client_id" character varying(64) NOT NULL, "name" character varying(120) NOT NULL, "secret_hash" character varying(100) NOT NULL, "scopes" jsonb NOT NULL DEFAULT '[]'::jsonb, "active" boolean NOT NULL DEFAULT true, "last_used_at" TIMESTAMP, "created_by" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_api_clients_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_api_clients_client_id" UNIQUE ("client_id"), CONSTRAINT "FK_api_clients_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "api_clients"`);
  }
}
