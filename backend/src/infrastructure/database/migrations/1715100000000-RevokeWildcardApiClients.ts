import { MigrationInterface, QueryRunner } from 'typeorm';

export class RevokeWildcardApiClients1715100000000 implements MigrationInterface {
  name = 'RevokeWildcardApiClients1715100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "api_clients" SET "active" = false, "updated_at" = now() WHERE "scopes" @> '["*"]'::jsonb`);
  }

  public async down(): Promise<void> {
    // Revoked credentials are not reactivated on rollback. Administrators can
    // recreate a client with specific scopes after reviewing access.
  }
}
