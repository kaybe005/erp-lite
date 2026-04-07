-- ERP Lite Database Schema
-- Run this script to initialize the database

-- Create enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SalesOrderStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create unique index on users email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantityInStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- Create unique index on products SKU
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");

-- Create suppliers table
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- Create unique index on purchase_orders orderNumber
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_orders_orderNumber_key" ON "purchase_orders"("orderNumber");

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS "sales_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdById" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- Create unique index on sales_orders orderNumber
CREATE UNIQUE INDEX IF NOT EXISTS "sales_orders_orderNumber_key" ON "sales_orders"("orderNumber");

-- Create sales_order_items table
CREATE TABLE IF NOT EXISTS "sales_order_items" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "purchase_orders" 
ADD CONSTRAINT IF NOT EXISTS "purchase_orders_supplierId_fkey" 
FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_orders" 
ADD CONSTRAINT IF NOT EXISTS "purchase_orders_createdById_fkey" 
FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_order_items" 
ADD CONSTRAINT IF NOT EXISTS "purchase_order_items_purchaseOrderId_fkey" 
FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_order_items" 
ADD CONSTRAINT IF NOT EXISTS "purchase_order_items_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales_orders" 
ADD CONSTRAINT IF NOT EXISTS "sales_orders_createdById_fkey" 
FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales_order_items" 
ADD CONSTRAINT IF NOT EXISTS "sales_order_items_salesOrderId_fkey" 
FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_order_items" 
ADD CONSTRAINT IF NOT EXISTS "sales_order_items_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default admin user (password: admin123)
INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
VALUES (
    'admin-user-001',
    'Admin User',
    'admin@erplite.com',
    '$2a$12$QIt7X2lZOj6yg3S//mlONOcSHabQhQhNvTvkFsR2mvTjjk7L1WSOu',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- Insert default staff user (password: staff123)
INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "isActive", "createdAt", "updatedAt")
VALUES (
    'staff-user-001',
    'Staff User',
    'staff@erplite.com',
    '$2a$12$GBNUNhj.JYJAs2ArCR5TueuU4HIoY2ocfboHcvhQOg0cWCPp66Y1.',
    'STAFF',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;
