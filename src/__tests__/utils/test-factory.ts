import { PrismaClient, User, Organization, Property, Inspection, ChecklistItem } from '@str-certified/database';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';

export class TestFactory {
  constructor(private prisma: PrismaClient) {}

  async createOrganization(overrides: Partial<Organization> = {}) {
    return this.prisma.organization.create({
      data: {
        name: faker.company.name(),
        slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
        plan: 'PROFESSIONAL',
        ...overrides,
      },
    });
  }

  async createUser(organizationId: string, overrides: Partial<User> = {}) {
    const email = overrides.email || faker.internet.email();
    const passwordHash = await hash(overrides.passwordHash || 'password123', 12);

    return this.prisma.user.create({
      data: {
        email,
        name: faker.person.fullName(),
        passwordHash,
        role: 'INSPECTOR',
        organizationId,
        emailVerified: new Date(),
        ...overrides,
      },
    });
  }

  async createProperty(organizationId: string, overrides: Partial<Property> = {}) {
    return this.prisma.property.create({
      data: {
        organizationId,
        name: faker.company.name() + ' Property',
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode('#####'),
        propertyType: faker.helpers.arrayElement(['HOUSE', 'APARTMENT', 'CONDO', 'TOWNHOUSE']),
        bedrooms: faker.number.int({ min: 1, max: 5 }),
        bathrooms: faker.number.float({ min: 1, max: 4, precision: 0.5 }),
        maxGuests: faker.number.int({ min: 2, max: 12 }),
        status: 'ACTIVE',
        ...overrides,
      },
    });
  }

  async createInspection(
    propertyId: string,
    inspectorId: string,
    organizationId: string,
    overrides: Partial<Inspection> = {}
  ) {
    // First, get or create a template
    let template = await this.prisma.checklistTemplate.findFirst({
      where: { organizationId },
    });

    if (!template) {
      template = await this.createChecklistTemplate(organizationId);
    }

    return this.prisma.inspection.create({
      data: {
        propertyId,
        inspectorId,
        organizationId,
        templateId: template.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        ...overrides,
      },
      include: {
        property: true,
        inspector: true,
        checklistItems: true,
      },
    });
  }

  async createChecklistTemplate(organizationId: string) {
    return this.prisma.checklistTemplate.create({
      data: {
        organizationId,
        name: 'Test Safety Checklist',
        description: 'Test checklist for automated testing',
        categories: {
          create: [
            {
              name: 'Fire Safety',
              icon: 'flame',
              sortOrder: 1,
              templateItems: {
                create: [
                  {
                    label: 'Smoke Detectors',
                    evidenceType: 'PHOTO',
                    isRequired: true,
                  },
                  {
                    label: 'Fire Extinguisher',
                    evidenceType: 'PHOTO',
                    isRequired: true,
                  },
                ],
              },
            },
            {
              name: 'General Safety',
              icon: 'shield',
              sortOrder: 2,
              templateItems: {
                create: [
                  {
                    label: 'First Aid Kit',
                    evidenceType: 'PHOTO',
                    isRequired: true,
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
  }

  async createChecklistItems(inspectionId: string, templateId: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: {
        categories: {
          include: {
            templateItems: true,
          },
        },
      },
    });

    if (!template) throw new Error('Template not found');

    const items = [];
    for (const category of template.categories) {
      for (const templateItem of category.templateItems) {
        items.push({
          inspectionId,
          templateItemId: templateItem.id,
          categoryId: category.id,
          label: templateItem.label,
          evidenceType: templateItem.evidenceType,
          status: 'PENDING' as const,
        });
      }
    }

    await this.prisma.checklistItem.createMany({
      data: items,
    });

    return this.prisma.checklistItem.findMany({
      where: { inspectionId },
    });
  }

  async createScraperJob(propertyId: string) {
    return this.prisma.scraperJob.create({
      data: {
        propertyId,
        platform: 'VRBO',
        status: 'PENDING',
      },
    });
  }

  async cleanup() {
    // Clean up in correct order to avoid foreign key constraints
    await this.prisma.itemHistory.deleteMany();
    await this.prisma.media.deleteMany();
    await this.prisma.checklistItem.deleteMany();
    await this.prisma.inspectionReport.deleteMany();
    await this.prisma.activity.deleteMany();
    await this.prisma.inspectorAssignment.deleteMany();
    await this.prisma.inspection.deleteMany();
    await this.prisma.scraperJob.deleteMany();
    await this.prisma.property.deleteMany();
    await this.prisma.templateItem.deleteMany();
    await this.prisma.category.deleteMany();
    await this.prisma.checklistTemplate.deleteMany();
    await this.prisma.notification.deleteMany();
    await this.prisma.apiKey.deleteMany();
    await this.prisma.session.deleteMany();
    await this.prisma.account.deleteMany();
    await this.prisma.user.deleteMany();
    await this.prisma.organization.deleteMany();
  }
}