-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_local" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'en',
    "phone_prefix" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "country_id" TEXT,
ADD COLUMN     "document_type" TEXT,
ADD COLUMN     "document_number" TEXT,
ADD COLUMN     "address_zip_code" TEXT,
ADD COLUMN     "preferred_language" TEXT DEFAULT 'pt-BR';

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "country_id" TEXT,
ADD COLUMN     "business_license" TEXT,
ADD COLUMN     "tax_id" TEXT,
ADD COLUMN     "preferred_language" TEXT DEFAULT 'en',
ADD COLUMN     "time_zone" TEXT,
ADD COLUMN     "address_zip_code" TEXT,
ADD COLUMN     "minimum_order_value" DECIMAL(10,2),
ADD COLUMN     "shipping_methods" TEXT[];

-- AlterTable
ALTER TABLE "suppliers" ALTER COLUMN "cnpj" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "country_id" TEXT,
ADD COLUMN     "exchange_rate" DECIMAL(10,6),
ADD COLUMN     "shipping_type" TEXT,
ADD COLUMN     "customs_value" DECIMAL(10,2),
ADD COLUMN     "customs_description" TEXT,
ADD COLUMN     "customer_language" TEXT DEFAULT 'pt-BR',
ADD COLUMN     "supplier_language" TEXT DEFAULT 'en';

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "translations_key_language_key" ON "translations"("key", "language");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;