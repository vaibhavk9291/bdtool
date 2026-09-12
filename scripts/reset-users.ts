import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Checking current users...')
  const users = await prisma.user.findMany()
  console.log(`Found ${users.length} users.`)

  let admin = users.find(u => u.username === 'admin')

  if (!admin) {
    console.log('Admin user not found. Creating one...')
    admin = await prisma.user.create({
      data: {
        username: 'admin',
        displayName: 'Admin',
        role: 'ADMIN'
      }
    })
  }

  console.log(`Admin user ID: ${admin.id}`)

  const nonAdminUserIds = users.filter(u => u.id !== admin!.id).map(u => u.id)
  
  if (nonAdminUserIds.length === 0) {
    console.log('No non-admin users to delete.')
    return
  }

  console.log(`Deleting ${nonAdminUserIds.length} non-admin users...`)

  // Unassign leads
  await prisma.lead.updateMany({
    where: { assignedToId: { in: nonAdminUserIds } },
    data: { assignedToId: null }
  })

  // Delete associated records due to restrict constraints
  await prisma.call.deleteMany({
    where: { userId: { in: nonAdminUserIds } }
  })
  
  await prisma.activityLog.deleteMany({
    where: { userId: { in: nonAdminUserIds } }
  })

  // Finally delete the users
  const result = await prisma.user.deleteMany({
    where: { id: { in: nonAdminUserIds } }
  })

  console.log(`Successfully deleted ${result.count} users.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
