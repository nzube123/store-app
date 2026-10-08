import { prisma } from '@shop/database';
import type { Profile } from 'passport-google-oauth20';

export async function findOrCreateGoogleUser(profile: Profile) {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  if (!email) throw new Error('Google did not provide an email address.');
  const name = profile.displayName || email.split('@')[0] || 'Cedar & Loom customer';
  const image = profile.photos?.[0]?.value ?? null;
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, image },
    create: { email, name, image },
    select: { id: true, email: true, name: true, image: true },
  });
  await prisma.oAuthAccount.upsert({
    where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.id } },
    update: { userId: user.id },
    create: { provider: 'google', providerAccountId: profile.id, userId: user.id },
  });
  return user;
}
