const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');

dotenv.config();

const categories = [
  { name: 'Fantasy', slug: 'fantasy', description: 'Fantasy and magical realism books' },
  { name: 'Thriller', slug: 'thriller', description: 'Suspenseful and thrilling stories' },
  { name: 'Crime', slug: 'crime', description: 'Crime and detective novels' },
  { name: 'Mystery', slug: 'mystery', description: 'Mystery and puzzle books' },
  { name: 'Romance', slug: 'romance', description: 'Romance novels and love stories' },
  { name: 'Science Fiction', slug: 'science-fiction', description: 'Sci-fi and futuristic stories' },
  { name: 'Horror', slug: 'horror', description: 'Horror and supernatural books' },
  { name: 'Biography', slug: 'biography', description: 'Biographies and memoirs' },
  { name: 'Self-Help', slug: 'self-help', description: 'Self-improvement and personal development' },
  { name: 'Academic / Educational', slug: 'academic', description: 'Textbooks and educational materials' },
  { name: 'Children', slug: 'children', description: 'Children\'s books and young adult fiction' }
];

async function initData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://jayalaxmishetty0612_db_user:S0KTjU0u7vB9ck0t@book-bridge.bupiiom.mongodb.net/bookbridge?retryWrites=true&w=majority&appName=book-bridge');
    console.log('✅ MongoDB Connected');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@bookbridge.com' });
    if (!adminExists) {
      const admin = await User.create({
        username: 'admin',
        email: 'admin@bookbridge.com',
        password: 'Admin123!',
        role: 'admin'
      });
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('⚠️  Admin user already exists');
    }

    // Create categories
    let createdCount = 0;
    for (const catData of categories) {
      const existing = await Category.findOne({ slug: catData.slug });
      if (!existing) {
        await Category.create(catData);
        createdCount++;
        console.log(`✅ Created category: ${catData.name}`);
      } else {
        console.log(`⚠️  Category already exists: ${catData.name}`);
      }
    }

    console.log(`\n✅ Initialization complete!`);
    console.log(`   - Created ${createdCount} new categories`);
    console.log(`   - Admin login: admin@bookbridge.com / Admin123!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initData();
