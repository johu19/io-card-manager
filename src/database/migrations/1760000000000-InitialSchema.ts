import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "customer_document_type_enum" AS ENUM ('DNI')
    `);

    await queryRunner.query(`
      CREATE TYPE "product_network_enum" AS ENUM ('VISA')
    `);

    await queryRunner.query(`
      CREATE TYPE "product_currency_enum" AS ENUM ('PEN', 'USD')
    `);

    await queryRunner.query(`
      CREATE TYPE "product_type_enum" AS ENUM ('CARD')
    `);

    await queryRunner.query(`
      CREATE TYPE "product_status_enum" AS ENUM ('ISSUED', 'REQUESTED')
    `);

    await queryRunner.query(`
      CREATE TABLE "customer" (
        "id" SERIAL NOT NULL,
        "document_type" "customer_document_type_enum" NOT NULL,
        "document_number" character varying NOT NULL,
        "full_name" character varying NOT NULL,
        "age" integer NOT NULL,
        "email" character varying NOT NULL,
        CONSTRAINT "UQ_customer_document_number" UNIQUE ("document_number"),
        CONSTRAINT "PK_customer_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product" (
        "id" SERIAL NOT NULL,
        "network" "product_network_enum" NOT NULL,
        "currency" "product_currency_enum" NOT NULL,
        "type" "product_type_enum" NOT NULL,
        "status" "product_status_enum" NOT NULL,
        "metadata" jsonb,
        "customer_id" integer NOT NULL,
        CONSTRAINT "PK_product_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "product"');
    await queryRunner.query('DROP TABLE "customer"');
    await queryRunner.query('DROP TYPE "product_status_enum"');
    await queryRunner.query('DROP TYPE "product_type_enum"');
    await queryRunner.query('DROP TYPE "product_currency_enum"');
    await queryRunner.query('DROP TYPE "product_network_enum"');
    await queryRunner.query('DROP TYPE "customer_document_type_enum"');
  }
}
