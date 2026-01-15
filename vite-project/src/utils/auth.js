import bcrypt from "bcryptjs";

// 🔐 This is the bcrypt hash of the password: admin123
// You can generate a new one if you want
const ADMIN_PASSWORD_HASH =
  "$2a$12$g.9lQ6uDen51JLuqJ6aKMuRZWeu5CJISCGRC7I86QHdg3bnmOmjmy";

export function verifyAdminPassword(inputPassword) {
  return bcrypt.compareSync(inputPassword, ADMIN_PASSWORD_HASH);
}
