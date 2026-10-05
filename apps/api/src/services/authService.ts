import { Prisma, prisma } from '@shop/database';
import type { Profile } from 'passport-google-oauth20';

type GoogleIdentity = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

export async function findOrCreateGoogleUser(profile: Profile) {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  if (!email) throw new Error('Google did not provide an email address.');
  return findOrCreateGoogleUserFromIdentity({
    id: profile.id,
    email,
    name: profile.displayName || email.split('@')[0] || 'Cedar & Loom customer',
    image: profile.photos?.[0]?.value ?? null,
  });
}

export async function findOrCreateGoogleUserFromIdentity(identity: GoogleIdentity) {
  const email = identity.email.toLowerCase();
  const accountWhere = {
    provider_providerAccountId: { provider: 'google', providerAccountId: identity.id },
  };

  try {
    return await prisma.$transaction(async (transaction) => {
      const linkedAccount = await transaction.oAuthAccount.findUnique({
        where: accountWhere,
        include: { user: { select: { id: true, email: true, name: true, image: true } } },
      });
      if (linkedAccount) return linkedAccount.user;

      const user = await transaction.user.upsert({
        where: { email },
        update: { name: identity.name, image: identity.image },
        create: { email, name: identity.name, image: identity.image },
        select: { id: true, email: true, name: true, image: true },
      });
      await transaction.oAuthAccount.create({
        data: { provider: 'google', providerAccountId: identity.id, userId: user.id },
      });
      return user;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const linkedAccount = await prisma.oAuthAccount.findUnique({
        where: accountWhere,
        include: { user: { select: { id: true, email: true, name: true, image: true } } },
      });
      if (linkedAccount) return linkedAccount.user;
    }
    throw error;
  }
}
