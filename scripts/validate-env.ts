import { validateServerEnvironment } from "../src/lib/environment-validation.ts";

const isProduction =
  process.argv.includes("--production") ||
  process.env.NODE_ENV === "production";
const errors = validateServerEnvironment(process.env, isProduction);

if (errors.length > 0) {
  console.error("Environment validation failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exitCode = 1;
} else {
  console.log("Environment configuration is valid.");
}
