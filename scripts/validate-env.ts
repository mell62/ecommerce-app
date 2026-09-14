import { validateServerEnvironment } from "../src/lib/environment-validation.ts";

const errors = validateServerEnvironment(process.env);

if (errors.length > 0) {
  console.error("Environment validation failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exitCode = 1;
} else {
  console.log("Environment configuration is valid.");
}
