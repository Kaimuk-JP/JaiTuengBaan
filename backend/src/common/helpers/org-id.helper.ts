import { PrismaService } from '../../core/prisma/prisma.service';

export async function getStaffOrganizationId(
  req: any,
  prisma: PrismaService,
): Promise<string | undefined> {
  if (req.user.role === 'ADMIN') return undefined;
  if (!['STAFF', 'EXECUTIVE'].includes(req.user.role)) return undefined;

  if (req.user.organizationId) return req.user.organizationId;

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { organizationId: true },
  });

  return user?.organizationId || undefined;
}

export async function getUserOrganizationId(
  req: any,
  prisma: PrismaService,
): Promise<string | undefined> {
  if (req.user.role === 'ADMIN') return undefined;

  if (req.user.organizationId) return req.user.organizationId;

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { organizationId: true },
  });

  return user?.organizationId || undefined;
}
