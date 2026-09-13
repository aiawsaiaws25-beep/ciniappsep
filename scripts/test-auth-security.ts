import { signJwtToken, verifyJwtToken } from "../src/lib/auth";

async function runAuthSecurityTest() {
  console.log("🧪 [QA Agent] Starting Authentication & Role-Based Authorization Security Test...");

  const regularUser = {
    id: "11111111-1111-1111-1111-111111111111",
    email: "regular@cinebook.test",
    fullName: "Regular User",
    role: "USER" as const,
  };

  const adminUser = {
    id: "99999999-9999-9999-9999-999999999999",
    email: "admin@cinebook.test",
    fullName: "Admin User",
    role: "ADMIN" as const,
  };

  // 1. Sign & verify regular user token
  const userToken = signJwtToken(regularUser);
  const decodedUser = verifyJwtToken(userToken);

  if (!decodedUser || decodedUser.role !== "USER") {
    console.error("❌ FAIL: User token decoding failed");
    process.exit(1);
  }

  // 2. Sign & verify admin token
  const adminToken = signJwtToken(adminUser);
  const decodedAdmin = verifyJwtToken(adminToken);

  if (!decodedAdmin || decodedAdmin.role !== "ADMIN") {
    console.error("❌ FAIL: Admin token decoding failed");
    process.exit(1);
  }

  // 3. Test tampered / invalid token
  const tamperedToken = userToken + "tampered";
  const decodedTampered = verifyJwtToken(tamperedToken);

  if (decodedTampered !== null) {
    console.error("❌ FAIL: Tampered token was accepted!");
    process.exit(1);
  }

  console.log("  ✅ Role claims (USER vs ADMIN) preserved correctly in JWT signature");
  console.log("  ✅ Tampered token rejected cleanly");
  console.log("🎉 PASS: Auth token verification and signature security passed.");
}

runAuthSecurityTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
