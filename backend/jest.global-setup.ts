import { config } from 'dotenv';
import { execSync } from 'child_process';

export default async function globalSetup() {
  // Load test environment variables
  config({ path: '.env.test' });
  
  console.log('🧪 Setting up test environment...');
  
  try {
    // Run database migrations for test database
    console.log('📊 Running database migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL 
      }
    });
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('✅ Test environment setup complete!');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    process.exit(1);
  }
}