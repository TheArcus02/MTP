import 'dotenv/config';
import { db } from '../src/db/client.js';
import { users, leaveRequests } from '../src/db/schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('<1 Seeding database...');

  try {
    console.log('=Ý Creating users...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const [admin] = await db
      .insert(users)
      .values({
        email: 'admin@mtp.com',
        passwordHash: hashedPassword,
        fullName: 'Admin User',
        role: 'admin',
      })
      .returning();

    const [employee1] = await db
      .insert(users)
      .values({
        email: 'john.doe@mtp.com',
        passwordHash: hashedPassword,
        fullName: 'John Doe',
        role: 'employee',
      })
      .returning();

    const [employee2] = await db
      .insert(users)
      .values({
        email: 'jane.smith@mtp.com',
        passwordHash: hashedPassword,
        fullName: 'Jane Smith',
        role: 'employee',
      })
      .returning();

    console.log(' Users created successfully');
    console.log(`   - Admin: ${admin.email}`);
    console.log(`   - Employee: ${employee1.email}`);
    console.log(`   - Employee: ${employee2.email}`);

    console.log('=Ý Creating leave requests...');

    await db.insert(leaveRequests).values([
      {
        userId: employee1.id,
        startDate: new Date('2025-12-20'),
        endDate: new Date('2025-12-27'),
        reason: 'Christmas vacation with family',
        status: 'pending',
      },
      {
        userId: employee1.id,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
        reason: 'Personal time off',
        status: 'approved',
        adminComment: 'Approved - enjoy your time off!',
      },
      {
        userId: employee2.id,
        startDate: new Date('2025-12-15'),
        endDate: new Date('2025-12-22'),
        reason: 'Year-end vacation',
        status: 'pending',
      },
    ]);

    console.log(' Leave requests created successfully');
    console.log('\n<‰ Database seeding completed!');
    console.log('\nTest credentials:');
    console.log('  Admin:');
    console.log('    Email: admin@mtp.com');
    console.log('    Password: password123');
    console.log('  Employee:');
    console.log('    Email: john.doe@mtp.com');
    console.log('    Password: password123');
  } catch (error) {
    console.error('L Seeding failed:', error);
    process.exit(1);
  }
}

seed();
