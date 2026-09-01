import { describe, expect, it } from "vitest";
import {
  SHIPPING_ADDRESS_LIMITS,
  validateShippingAddress,
} from "@/lib/shipping-address";

const validAddress = {
  fullName: "Grace Hopper",
  addressLine1: "123 Computer Way",
  addressLine2: "Apartment 4B",
  city: "Arlington",
  state: "Virginia",
  postalCode: "22201",
  country: "US",
};

describe("validateShippingAddress", () => {
  it("accepts and normalizes a valid United States address", () => {
    const result = validateShippingAddress({
      ...validAddress,
      fullName: "  Grace Hopper  ",
      addressLine2: "  Apartment 4B  ",
      postalCode: "22201-1234",
    });

    expect(result).toEqual({
      success: true,
      data: {
        ...validAddress,
        postalCode: "22201-1234",
      },
    });
  });

  it("allows the optional second address line to be empty", () => {
    const result = validateShippingAddress({
      ...validAddress,
      addressLine2: "",
    });

    expect(result.success).toBe(true);
  });

  it("returns field errors when required address values are missing", () => {
    const result = validateShippingAddress({});

    expect(result).toEqual({
      success: false,
      errors: {
        fullName: "Enter the recipient's full name.",
        addressLine1: "Enter a complete street address.",
        city: "Enter a city.",
        state: "Enter a state.",
        postalCode: "Enter a valid 5-digit or ZIP+4 code.",
        country: "Shipping is currently available in the United States.",
      },
    });
  });

  it("rejects unsupported input shapes", () => {
    const result = validateShippingAddress("not an address");

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.errors).toMatchObject({
        fullName: expect.any(String),
        addressLine1: expect.any(String),
        postalCode: expect.any(String),
        country: expect.any(String),
      });
    }
  });

  it("rejects fields that exceed their storage limits", () => {
    const result = validateShippingAddress({
      ...validAddress,
      fullName: "a".repeat(SHIPPING_ADDRESS_LIMITS.fullName + 1),
      addressLine1: "a".repeat(
        SHIPPING_ADDRESS_LIMITS.addressLine1 + 1
      ),
      addressLine2: "a".repeat(
        SHIPPING_ADDRESS_LIMITS.addressLine2 + 1
      ),
      city: "a".repeat(SHIPPING_ADDRESS_LIMITS.city + 1),
      state: "a".repeat(SHIPPING_ADDRESS_LIMITS.state + 1),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(Object.keys(result.errors)).toEqual([
        "fullName",
        "addressLine1",
        "addressLine2",
        "city",
        "state",
      ]);
    }
  });

  it.each(["1234", "123456", "ABCDE", "12345-123"])(
    "rejects invalid ZIP code %s",
    (postalCode) => {
      const result = validateShippingAddress({
        ...validAddress,
        postalCode,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.errors.postalCode).toBe(
          "Enter a valid 5-digit or ZIP+4 code."
        );
      }
    }
  );
});
