import type { FastifyBaseLogger } from 'fastify';
import { db } from './services/database.js';

export async function seedDatabase(log: FastifyBaseLogger): Promise<void> {
  const storeCount = await db.stores.count();
  if (storeCount > 0) {
    log.info('Database already seeded, skipping');
    return;
  }

  log.info('Seeding database with demo data...');

  await db.stores.createMany([
    {
      id: 'store_001',
      retailerId: 'ret_walmart',
      retailerName: 'Walmart',
      name: 'Walmart Express Centro',
      address: 'Av. Juárez 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06000',
      latitude: 19.4326,
      longitude: -99.1332,
      phone: '+525512345678',
      hours: [
        { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 1, openTime: '07:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 2, openTime: '07:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 3, openTime: '07:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 4, openTime: '07:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 5, openTime: '07:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false },
      ],
      services: ['PHARMACY', 'BAKERY', 'ATM'],
      isMock: true,
      source: 'MOCK',
    },
    {
      id: 'store_002',
      retailerId: 'ret_heb',
      retailerName: 'H-E-B',
      name: 'H-E-B Condesa',
      address: 'Av. Michoacán 456',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06140',
      latitude: 19.4195,
      longitude: -99.1718,
      phone: '+525598765432',
      hours: [
        { dayOfWeek: 0, openTime: '07:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 1, openTime: '06:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 2, openTime: '06:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 3, openTime: '06:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 4, openTime: '06:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 5, openTime: '06:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 6, openTime: '07:00', closeTime: '23:00', isClosed: false },
      ],
      services: ['PHARMACY', 'BAKERY', 'DELI', 'BUTCHER'],
      isMock: true,
      source: 'MOCK',
    },
    {
      id: 'store_003',
      retailerId: 'ret_costco',
      retailerName: 'Costco',
      name: 'Costco Polanco',
      address: 'Av. Ejército Nacional 789',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '11560',
      latitude: 19.4350,
      longitude: -99.1950,
      phone: '+525555512345',
      hours: [
        { dayOfWeek: 0, openTime: '09:00', closeTime: '20:30', isClosed: false },
        { dayOfWeek: 1, openTime: '09:00', closeTime: '20:30', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '20:30', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '20:30', isClosed: false },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '20:30', isClosed: false },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '20:30', isClosed: false },
        { dayOfWeek: 6, openTime: '09:00', closeTime: '20:30', isClosed: false },
      ],
      services: ['PHARMACY', 'BAKERY', 'DELI', 'BUTCHER', 'ATM'],
      isMock: true,
      source: 'MOCK',
    },
    {
      id: 'store_004',
      retailerId: 'ret_walmart',
      retailerName: 'Walmart',
      name: 'Walmart Super Roma',
      address: 'Calle Tabasco 321',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06700',
      latitude: 19.4210,
      longitude: -99.1580,
      phone: '+525512349999',
      hours: [
        { dayOfWeek: 0, openTime: '07:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 1, openTime: '06:00', closeTime: '00:00', isClosed: false },
        { dayOfWeek: 2, openTime: '06:00', closeTime: '00:00', isClosed: false },
        { dayOfWeek: 3, openTime: '06:00', closeTime: '00:00', isClosed: false },
        { dayOfWeek: 4, openTime: '06:00', closeTime: '00:00', isClosed: false },
        { dayOfWeek: 5, openTime: '06:00', closeTime: '00:00', isClosed: false },
        { dayOfWeek: 6, openTime: '07:00', closeTime: '23:00', isClosed: false },
      ],
      services: ['BAKERY', 'DELI', 'DRIVE_THROUGH'],
      isMock: true,
      source: 'MOCK',
    },
  ]);

  log.info('Seeded 4 stores');
}
