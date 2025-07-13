import { PrismaClient } from '@prisma/client';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test database
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL
        }
      }
    });
    
    // Disconnect from database
    await prisma.$disconnect();
    
    console.log('✅ Test environment cleanup complete!');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
  }
}