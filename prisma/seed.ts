import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const sampleProducts = [
  {
    name: "Wireless Keyboard",
    sku: "KB-001",
    category: "Electronics",
    description: "Ergonomic wireless keyboard with backlight",
    unitPrice: 79.99,
    quantityInStock: 50,
    reorderLevel: 10,
  },
  {
    name: "USB-C Hub",
    sku: "HUB-002",
    category: "Electronics",
    description: "7-in-1 USB-C hub with HDMI output",
    unitPrice: 49.99,
    quantityInStock: 30,
    reorderLevel: 15,
  },
  {
    name: "Office Chair",
    sku: "CHR-003",
    category: "Furniture",
    description: "Ergonomic office chair with lumbar support",
    unitPrice: 299.99,
    quantityInStock: 8,
    reorderLevel: 5,
  },
  {
    name: "Standing Desk",
    sku: "DSK-004",
    category: "Furniture",
    description: "Electric adjustable standing desk",
    unitPrice: 599.99,
    quantityInStock: 12,
    reorderLevel: 3,
  },
  {
    name: "Monitor Stand",
    sku: "STD-005",
    category: "Accessories",
    description: "Aluminum monitor stand with storage",
    unitPrice: 89.99,
    quantityInStock: 25,
    reorderLevel: 10,
  },
  {
    name: "Webcam HD",
    sku: "WEB-006",
    category: "Electronics",
    description: "1080p HD webcam with built-in microphone",
    unitPrice: 69.99,
    quantityInStock: 5,
    reorderLevel: 10,
  },
  {
    name: "Desk Lamp LED",
    sku: "LMP-007",
    category: "Lighting",
    description: "Adjustable LED desk lamp with dimmer",
    unitPrice: 45.99,
    quantityInStock: 40,
    reorderLevel: 15,
  },
  {
    name: "Notebook Set",
    sku: "NB-008",
    category: "Stationery",
    description: "Premium notebook set with pen holder",
    unitPrice: 24.99,
    quantityInStock: 100,
    reorderLevel: 20,
  },
] as const

const sampleSuppliers = [
  {
    companyName: "TechSupply Co.",
    contactName: "John Smith",
    email: "john@techsupply.com",
    phone: "+1-555-0101",
    address: "123 Tech Lane, San Francisco, CA 94102",
  },
  {
    companyName: "Office Essentials Inc.",
    contactName: "Sarah Johnson",
    email: "sarah@officeessentials.com",
    phone: "+1-555-0102",
    address: "456 Business Ave, New York, NY 10001",
  },
  {
    companyName: "Furniture World",
    contactName: "Michael Brown",
    email: "michael@furnitureworld.com",
    phone: "+1-555-0103",
    address: "789 Maple Street, Chicago, IL 60601",
  },
  {
    companyName: "Global Electronics",
    contactName: "Emily Davis",
    email: "emily@globalelectronics.com",
    phone: "+1-555-0104",
    address: "321 Circuit Blvd, Austin, TX 78701",
  },
] as const

async function main() {
  console.log("Starting seed...")

  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@erplite.com" },
    update: {
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name: "Admin User",
      email: "admin@erplite.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  })
  console.log("Upserted admin user:", admin.email)

  const staffPassword = await bcrypt.hash("staff123", 12)
  const staff = await prisma.user.upsert({
    where: { email: "staff@erplite.com" },
    update: {
      name: "Staff User",
      passwordHash: staffPassword,
      role: "STAFF",
      isActive: true,
    },
    create: {
      name: "Staff User",
      email: "staff@erplite.com",
      passwordHash: staffPassword,
      role: "STAFF",
      isActive: true,
    },
  })
  console.log("Upserted staff user:", staff.email)

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        category: product.category,
        description: product.description,
        unitPrice: product.unitPrice,
        quantityInStock: product.quantityInStock,
        reorderLevel: product.reorderLevel,
      },
      create: product,
    })
  }
  console.log("Upserted", sampleProducts.length, "products")

  for (const supplier of sampleSuppliers) {
    const existingSupplier = await prisma.supplier.findFirst({
      where: { companyName: supplier.companyName },
      select: { id: true },
    })

    if (!existingSupplier) {
      await prisma.supplier.create({
        data: supplier,
      })
    } else {
      await prisma.supplier.update({
        where: { id: existingSupplier.id },
        data: {
          contactName: supplier.contactName,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
        },
      })
    }
  }
  console.log("Upserted", sampleSuppliers.length, "suppliers")

  // Seed supplier-product relationships
  // Look up supplier and product IDs by their unique identifiers
  const [
    techSupply,
    officeEssentials,
    furnitureWorld,
    globalElectronics,
  ] = await Promise.all([
    prisma.supplier.findFirst({ where: { companyName: "TechSupply Co." }, select: { id: true } }),
    prisma.supplier.findFirst({ where: { companyName: "Office Essentials Inc." }, select: { id: true } }),
    prisma.supplier.findFirst({ where: { companyName: "Furniture World" }, select: { id: true } }),
    prisma.supplier.findFirst({ where: { companyName: "Global Electronics" }, select: { id: true } }),
  ])

  const [
    keyboard, hub, chair, desk, stand, webcam, lamp, notebook,
  ] = await Promise.all([
    prisma.product.findUnique({ where: { sku: "KB-001" }, select: { id: true } }),
    prisma.product.findUnique({ where: { sku: "HUB-002" }, select: { id: true } }),
    prisma.product.findUnique({ where: { sku: "CHR-003" }, select: { id: true } }),
    prisma.product.findUnique({ where: { sku: "DSK-004" }, select: { id: true } }),
    prisma.product.findUnique({ where: { sku: "STD-005" }, select: { id: true } }),
    prisma.product.findUnique({ where: { sku: "WEB-006" }, select: { id: true } }),
    prisma.product.findUnique({ where: { sku: "LMP-007" }, select: { id: true } }),
    prisma.product.findUnique({ where: { sku: "NB-008" }, select: { id: true } }),
  ])

  // Map: TechSupply Co. → Electronics (Keyboard, Hub, Webcam) + Monitor Stand (Accessories)
  // Global Electronics → Electronics (Keyboard, Hub, Webcam) as alternate supplier
  // Furniture World → Furniture (Chair, Desk) + Monitor Stand (Accessories)
  // Office Essentials → Stationery (Notebook) + Lighting (Lamp)
  const supplierProductLinks: { supplierId: string; productId: string }[] = []

  if (techSupply && keyboard) supplierProductLinks.push({ supplierId: techSupply.id, productId: keyboard.id })
  if (techSupply && hub)      supplierProductLinks.push({ supplierId: techSupply.id, productId: hub.id })
  if (techSupply && webcam)   supplierProductLinks.push({ supplierId: techSupply.id, productId: webcam.id })
  if (techSupply && stand)    supplierProductLinks.push({ supplierId: techSupply.id, productId: stand.id })

  if (globalElectronics && keyboard) supplierProductLinks.push({ supplierId: globalElectronics.id, productId: keyboard.id })
  if (globalElectronics && hub)      supplierProductLinks.push({ supplierId: globalElectronics.id, productId: hub.id })
  if (globalElectronics && webcam)   supplierProductLinks.push({ supplierId: globalElectronics.id, productId: webcam.id })

  if (furnitureWorld && chair) supplierProductLinks.push({ supplierId: furnitureWorld.id, productId: chair.id })
  if (furnitureWorld && desk)  supplierProductLinks.push({ supplierId: furnitureWorld.id, productId: desk.id })
  if (furnitureWorld && stand) supplierProductLinks.push({ supplierId: furnitureWorld.id, productId: stand.id })

  if (officeEssentials && lamp)     supplierProductLinks.push({ supplierId: officeEssentials.id, productId: lamp.id })
  if (officeEssentials && notebook) supplierProductLinks.push({ supplierId: officeEssentials.id, productId: notebook.id })

  for (const link of supplierProductLinks) {
    await prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: {
          supplierId: link.supplierId,
          productId: link.productId,
        },
      },
      update: {},
      create: link,
    })
  }
  console.log("Upserted", supplierProductLinks.length, "supplier-product links")

  console.log("Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
