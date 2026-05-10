import prisma from '../src/lib/prisma'

async function main() {
  console.log('Seeding database...')

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      displayName: 'Admin',
      role: 'ADMIN',
    },
  })

  // Create piyush (Admin)
  const piyush = await prisma.user.upsert({
    where: { username: 'piyush' },
    update: {},
    create: {
      username: 'piyush',
      displayName: 'Piyush',
      role: 'ADMIN',
    },
  })

  // Create User 1: alice
  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      displayName: 'Alice',
      role: 'USER',
    },
  })

  // Create User 2: bob
  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      displayName: 'Bob',
      role: 'USER',
    },
  })

  console.log({ admin, piyush, alice, bob })

  console.log({ admin, alice, bob })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
