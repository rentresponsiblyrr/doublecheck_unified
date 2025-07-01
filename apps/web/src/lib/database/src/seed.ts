import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: 'PROFESSIONAL',
    },
  });

  console.log('✅ Created organization:', org.name);

  // Create users
  const adminPassword = await hash('admin123', 12);
  const inspectorPassword = await hash('inspector123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@strcertified.com' },
    update: {},
    create: {
      email: 'admin@strcertified.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      organizationId: org.id,
      emailVerified: new Date(),
    },
  });

  const inspector1 = await prisma.user.upsert({
    where: { email: 'john@strcertified.com' },
    update: {},
    create: {
      email: 'john@strcertified.com',
      name: 'John Inspector',
      passwordHash: inspectorPassword,
      role: 'INSPECTOR',
      organizationId: org.id,
      emailVerified: new Date(),
    },
  });

  const inspector2 = await prisma.user.upsert({
    where: { email: 'jane@strcertified.com' },
    update: {},
    create: {
      email: 'jane@strcertified.com',
      name: 'Jane Inspector',
      passwordHash: inspectorPassword,
      role: 'INSPECTOR',
      organizationId: org.id,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created users');

  // Create checklist template
  const template = await prisma.checklistTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Standard Safety Inspection',
      description: 'Comprehensive safety checklist for short-term rental properties',
      categories: {
        create: [
          {
            name: 'Fire Safety',
            icon: 'flame',
            color: 'red',
            sortOrder: 1,
            templateItems: {
              create: [
                {
                  label: 'Smoke Detectors',
                  description: 'Check all smoke detectors are present and functional',
                  helpText: 'Test each detector and verify battery status',
                  evidenceType: 'PHOTO',
                  isRequired: true,
                  aiPrompt: 'Verify smoke detector is properly installed and has a green LED indicating it is functional',
                  sortOrder: 1,
                },
                {
                  label: 'Fire Extinguisher',
                  description: 'Verify fire extinguisher is present and not expired',
                  helpText: 'Check gauge is in green zone and inspection tag is current',
                  evidenceType: 'PHOTO',
                  isRequired: true,
                  aiPrompt: 'Check fire extinguisher gauge is in green zone and verify the inspection tag date',
                  sortOrder: 2,
                },
                {
                  label: 'Carbon Monoxide Detector',
                  description: 'Verify CO detector is present near sleeping areas',
                  evidenceType: 'PHOTO',
                  isRequired: true,
                  sortOrder: 3,
                },
              ],
            },
          },
          {
            name: 'Pool & Water Safety',
            icon: 'waves',
            color: 'blue',
            sortOrder: 2,
            templateItems: {
              create: [
                {
                  label: 'Pool Fence/Barrier',
                  description: 'Verify pool has proper safety barriers',
                  helpText: 'Check fence height (min 4ft) and self-closing gates',
                  evidenceType: 'PHOTO',
                  isRequired: false,
                  sortOrder: 1,
                },
                {
                  label: 'Pool Safety Equipment',
                  description: 'Life ring, shepherd\'s hook, and safety signage',
                  evidenceType: 'PHOTO',
                  isRequired: false,
                  sortOrder: 2,
                },
              ],
            },
          },
          {
            name: 'General Safety',
            icon: 'shield',
            color: 'green',
            sortOrder: 3,
            templateItems: {
              create: [
                {
                  label: 'First Aid Kit',
                  description: 'Verify first aid kit is stocked and accessible',
                  evidenceType: 'PHOTO',
                  isRequired: true,
                  sortOrder: 1,
                },
                {
                  label: 'Emergency Contact Information',
                  description: 'Posted emergency numbers and property information',
                  evidenceType: 'PHOTO',
                  isRequired: true,
                  sortOrder: 2,
                },
                {
                  label: 'Exterior Lighting',
                  description: 'Adequate lighting for walkways and entrances',
                  evidenceType: 'VISUAL',
                  isRequired: true,
                  sortOrder: 3,
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      categories: {
        include: {
          templateItems: true,
        },
      },
    },
  });

  console.log('✅ Created checklist template with', template.categories.length, 'categories');

  // Create sample properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        organizationId: org.id,
        name: 'Sunset Beach Villa',
        address: '123 Ocean Drive',
        city: 'Miami Beach',
        state: 'FL',
        zip: '33139',
        propertyType: 'HOUSE',
        bedrooms: 4,
        bathrooms: 3,
        maxGuests: 8,
        vrboUrl: 'https://www.vrbo.com/123456',
        status: 'ACTIVE',
      },
    }),
    prisma.property.create({
      data: {
        organizationId: org.id,
        name: 'Downtown Luxury Loft',
        address: '456 Main Street',
        city: 'Miami',
        state: 'FL',
        zip: '33131',
        propertyType: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        airbnbUrl: 'https://www.airbnb.com/rooms/789012',
        status: 'ACTIVE',
      },
    }),
    prisma.property.create({
      data: {
        organizationId: org.id,
        name: 'Cozy Mountain Cabin',
        address: '789 Pine Road',
        city: 'Asheville',
        state: 'NC',
        zip: '28801',
        propertyType: 'CABIN',
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
        vrboUrl: 'https://www.vrbo.com/345678',
        status: 'PENDING',
      },
    }),
  ]);

  console.log('✅ Created', properties.length, 'sample properties');

  // Create sample inspections
  const inspection = await prisma.inspection.create({
    data: {
      propertyId: properties[0].id,
      inspectorId: inspector1.id,
      organizationId: org.id,
      templateId: template.id,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  // Create checklist items from template
  const checklistItems = [];
  for (const category of template.categories) {
    for (const templateItem of category.templateItems) {
      checklistItems.push({
        inspectionId: inspection.id,
        templateItemId: templateItem.id,
        categoryId: category.id,
        label: templateItem.label,
        evidenceType: templateItem.evidenceType,
        status: 'PENDING' as const,
      });
    }
  }

  await prisma.checklistItem.createMany({
    data: checklistItems,
  });

  console.log('✅ Created inspection with', checklistItems.length, 'checklist items');

  // Create a completed inspection
  const completedInspection = await prisma.inspection.create({
    data: {
      propertyId: properties[1].id,
      inspectorId: inspector2.id,
      organizationId: org.id,
      templateId: template.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      score: 95,
      passStatus: 'PASSED',
    },
  });

  console.log('✅ Created completed inspection');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('Admin: admin@strcertified.com / admin123');
  console.log('Inspector: john@strcertified.com / inspector123');
  console.log('Inspector: jane@strcertified.com / inspector123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });