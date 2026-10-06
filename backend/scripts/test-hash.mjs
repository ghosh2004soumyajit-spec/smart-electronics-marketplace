import bcrypt from 'bcryptjs';

async function testHash() {
  const hash = '$2a$10$e8wF4rT67B3e.5jGgX2J7eQ0w.5G.061M2G0c0vYd/wH3.j7P2V5f';
  const match = await bcrypt.compare('Password123!', hash);
  console.log('Match?', match);
}

testHash();
