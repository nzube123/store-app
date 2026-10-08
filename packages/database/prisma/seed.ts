import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  { slug: 'arc-stoneware-vase', name: 'Arc Stoneware Vase', description: 'A sculptural, hand-finished stoneware vessel in a warm chalk glaze. Made for seasonal branches or simply on its own.', price: '68000.00', image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1000&q=85', category: 'Decor', stock: 18 },
  { slug: 'linen-table-runner', name: 'Linen Table Runner', description: 'Washed European flax linen with a relaxed drape and naturally soft texture. Finished with a delicate fringed edge.', price: '54000.00', image: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1000&q=85', category: 'Textiles', stock: 24 },
  { slug: 'everyday-ceramic-mug', name: 'Everyday Ceramic Mug', description: 'An easy-to-hold, wheel-thrown mug that brings a little ritual to your morning. Each piece is beautifully unique.', price: '32000.00', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1000&q=85', category: 'Tableware', stock: 36 },
  { slug: 'woven-market-basket', name: 'Woven Market Basket', description: 'Handwoven from sustainably harvested seagrass, with sturdy leather handles for market mornings and everyday storage.', price: '82000.00', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85', category: 'Everyday', stock: 12 },
  { slug: 'amber-glass-candle', name: 'Amber Glass Candle', description: 'A slow-burning soy wax candle with notes of cedar, bergamot, and quiet evenings. Poured in a reusable amber vessel.', price: '38000.00', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85', category: 'Home Fragrance', stock: 30 },
  { slug: 'organic-cotton-throw', name: 'Organic Cotton Throw', description: 'A generously sized, breathable cotton throw with a subtle woven stripe. Soft enough for the sofa, light enough for the bed.', price: '118000.00', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85', category: 'Textiles', stock: 9 },
  { slug: 'wooden-serving-board', name: 'Olivewood Serving Board', description: 'Carved from responsibly sourced olivewood, each board has its own grain and character. A lovely piece for sharing.', price: '76000.00', image: 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=1000&q=85', category: 'Tableware', stock: 15 },
  { slug: 'terra-incense-holder', name: 'Terra Incense Holder', description: 'A minimal, hand-shaped clay incense holder with a sandy matte finish. Designed for a slower, more mindful moment.', price: '28000.00', image: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=1000&q=85', category: 'Decor', stock: 21 }
];

async function main(): Promise<void> {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }
  console.info(`Seeded ${products.length} Cedar & Loom products.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
