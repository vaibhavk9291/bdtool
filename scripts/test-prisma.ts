import prisma from '../src/lib/prisma';
async function main() {
  console.log("Checking prisma...");
  const users = await prisma.user.findMany();
  console.log(users.length);
}
main().catch(console.error);
