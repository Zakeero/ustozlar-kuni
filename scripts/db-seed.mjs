import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const branches = [
  { slug: "pavarot", name: "Pavarot filiali", address: null },
  { slug: "dagbitskiy", name: "Dagbitskiy filiali", address: null },
];

for (const b of branches) {
  await sql`
    INSERT INTO branches (slug, name, address, sort_order)
    VALUES (${b.slug}, ${b.name}, ${b.address}, ${branches.indexOf(b)})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  `;
  console.log("✓ filial:", b.name);
}

console.log("\nFiliallar tayyor. Ustozlarni admin panel orqali qo'shing: /admin/ustozlar");
