const fs = require("fs");

const files = [
  "src/app/api/sections/route.ts",
  "src/app/api/reviews/route.ts",
  "src/app/api/progress/route.ts",
  "src/app/api/profile/route.ts",
  "src/app/api/lectures/route.ts",
  "src/app/api/enrollments/route.ts",
  "src/app/api/courses/route.ts",
  "src/app/api/auth/forgot-password/route.ts",
  "src/app/api/auth/register/route.ts",
  "src/app/api/auth/reset-password/route.ts",
  "src/app/api/admin/users/route.ts",
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("getValidationError")) continue;
  if (content.includes("@/lib/utils/validation")) continue;
  const importLine =
    'import { getValidationError } from "@/lib/utils/validation";\n';
  const firstImport = content.indexOf("import ");
  if (firstImport === -1) {
    content = importLine + content;
  } else {
    const endOfImports = content.indexOf("\n\n", firstImport);
    content =
      content.slice(0, endOfImports + 1) +
      importLine +
      content.slice(endOfImports + 1);
  }
  fs.writeFileSync(file, content);
}

console.log("Done");
