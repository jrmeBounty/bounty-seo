/**
 * RBAC Verification Script
 *
 * Tests that role-based access control is properly configured.
 * Run this to verify permissions are enforced correctly.
 */

import type { UserRole } from "../src/lib/rbac";
import { hasPermission, permissions } from "../src/lib/rbac";

console.log("🔐 RBAC Verification Script\n");
console.log("=" .repeat(60));

// Test matrix
const roles: UserRole[] = ["viewer", "staff", "admin"];
const criticalPermissions = [
	"locations.create",
	"keywords.delete",
	"rankings.check",
	"reviews.reply",
	"data.sync",
	"settings.update",
	"team.manage",
] as const;

// Create permission matrix
console.log("\n📊 Permission Matrix:\n");

// Header
console.log(
	"Permission".padEnd(25),
	"Viewer".padEnd(10),
	"Staff".padEnd(10),
	"Admin",
);
console.log("-".repeat(60));

// Test each permission
for (const permission of criticalPermissions) {
	const row = [
		permission.padEnd(25),
		hasPermission("viewer", permission) ? "✅" : "❌",
		hasPermission("staff", permission) ? "✅" : "❌",
		hasPermission("admin", permission) ? "✅" : "❌",
	];
	console.log(row.join("  ".padEnd(10)));
}

console.log("\n" + "=".repeat(60));

// Verify critical constraints
console.log("\n🧪 Critical Constraint Tests:\n");

const tests = [
	{
		name: "Viewers cannot create locations",
		pass: !hasPermission("viewer", "locations.create"),
	},
	{
		name: "Viewers cannot delete keywords",
		pass: !hasPermission("viewer", "keywords.delete"),
	},
	{
		name: "Viewers cannot sync data",
		pass: !hasPermission("viewer", "data.sync"),
	},
	{
		name: "Staff cannot manage team",
		pass: !hasPermission("staff", "team.manage"),
	},
	{
		name: "Staff cannot update settings",
		pass: !hasPermission("staff", "settings.update"),
	},
	{
		name: "Staff CAN reply to reviews",
		pass: hasPermission("staff", "reviews.reply"),
	},
	{
		name: "Staff CAN check rankings",
		pass: hasPermission("staff", "rankings.check"),
	},
	{
		name: "Admin can do everything",
		pass: criticalPermissions.every((p) => hasPermission("admin", p)),
	},
];

let passed = 0;
let failed = 0;

for (const test of tests) {
	const icon = test.pass ? "✅" : "❌";
	const status = test.pass ? "PASS" : "FAIL";
	console.log(`${icon} ${status}: ${test.name}`);

	if (test.pass) passed++;
	else failed++;
}

console.log("\n" + "=".repeat(60));

// Summary
console.log(`\n📈 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
	console.log("✅ All RBAC constraints are correctly configured!");
	console.log("   Your permission system is production-ready.\n");
	process.exit(0);
} else {
	console.log("❌ Some RBAC constraints failed!");
	console.log("   Review src/lib/rbac.ts and fix the permission definitions.\n");
	process.exit(1);
}
