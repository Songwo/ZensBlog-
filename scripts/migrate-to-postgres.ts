import { PrismaClient as SQLiteClient } from "@prisma/client";
import { PrismaClient as PostgresClient } from "@prisma/client";

const sqliteDb = new SQLiteClient({
  datasources: { db: { url: "file:./prisma/dev.db" } },
});

const postgresDb = new PostgresClient();

async function migrate() {
  console.log("🚀 Starting migration from SQLite to PostgreSQL...\n");

  try {
    // 1. Migrate Users
    console.log("📦 Migrating Users...");
    const users = await sqliteDb.user.findMany();
    for (const user of users) {
      await postgresDb.user.upsert({
        where: { id: user.id },
        create: user,
        update: user,
      });
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // 2. Migrate Categories
    console.log("📦 Migrating Categories...");
    const categories = await sqliteDb.category.findMany();
    for (const category of categories) {
      await postgresDb.category.upsert({
        where: { id: category.id },
        create: category,
        update: category,
      });
    }
    console.log(`✅ Migrated ${categories.length} categories\n`);

    // 3. Migrate Tags
    console.log("📦 Migrating Tags...");
    const tags = await sqliteDb.tag.findMany();
    for (const tag of tags) {
      await postgresDb.tag.upsert({
        where: { id: tag.id },
        create: tag,
        update: tag,
      });
    }
    console.log(`✅ Migrated ${tags.length} tags\n`);

    // 4. Migrate Posts
    console.log("📦 Migrating Posts...");
    const posts = await sqliteDb.post.findMany();
    for (const post of posts) {
      await postgresDb.post.upsert({
        where: { id: post.id },
        create: post,
        update: post,
      });
    }
    console.log(`✅ Migrated ${posts.length} posts\n`);

    // 5. Migrate PostTags
    console.log("📦 Migrating PostTags...");
    const postTags = await sqliteDb.postTag.findMany();
    for (const postTag of postTags) {
      await postgresDb.postTag.upsert({
        where: { postId_tagId: { postId: postTag.postId, tagId: postTag.tagId } },
        create: postTag,
        update: postTag,
      });
    }
    console.log(`✅ Migrated ${postTags.length} post-tag relations\n`);

    // 6. Migrate Comments
    console.log("📦 Migrating Comments...");
    const comments = await sqliteDb.comment.findMany();
    for (const comment of comments) {
      await postgresDb.comment.upsert({
        where: { id: comment.id },
        create: comment,
        update: comment,
      });
    }
    console.log(`✅ Migrated ${comments.length} comments\n`);

    // 7. Migrate SiteConfig
    console.log("📦 Migrating SiteConfig...");
    const configs = await sqliteDb.siteConfig.findMany();
    for (const config of configs) {
      await postgresDb.siteConfig.upsert({
        where: { key: config.key },
        create: config,
        update: config,
      });
    }
    console.log(`✅ Migrated ${configs.length} site configs\n`);

    console.log("🎉 Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Users: ${users.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Tags: ${tags.length}`);
    console.log(`   Posts: ${posts.length}`);
    console.log(`   PostTags: ${postTags.length}`);
    console.log(`   Comments: ${comments.length}`);
    console.log(`   SiteConfigs: ${configs.length}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sqliteDb.$disconnect();
    await postgresDb.$disconnect();
  }
}

migrate();
