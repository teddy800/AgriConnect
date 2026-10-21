import bcrypt from 'bcryptjs';

async function testPassword() {
  const password = 'password123';
  
  // Generate a new hash
  console.log('Generating hash for:', password);
  const hash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', hash);
  
  // Test the hash
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Hash matches password:', isMatch);
  
  // Test with the seed file hash
  const seedHash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.IizOFMJJLSYJ4pDnMkCeXsFYqQzDKO';
  const seedMatch = await bcrypt.compare(password, seedHash);
  console.log('\nTesting seed file hash:', seedHash);
  console.log('Seed hash matches password:', seedMatch);
}

testPassword().catch(console.error);
