export const SHIPPING_ADDRESS_LIMITS = {
  fullName: 80,
  addressLine1: 120,
  addressLine2: 120,
  city: 80,
  state: 50,
} as const;

export type ShippingAddress = Readonly<{
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: "US";
}>;

export type ShippingAddressField = keyof ShippingAddress;

export type ShippingAddressErrors = Partial<
  Record<ShippingAddressField, string>
>;

export type ShippingAddressValidationResult =
  | Readonly<{
      success: true;
      data: ShippingAddress;
    }>
  | Readonly<{
      success: false;
      errors: ShippingAddressErrors;
    }>;

function getTrimmedString(
  value: Record<string, unknown>,
  field: ShippingAddressField
): string {
  const fieldValue = value[field];

  return typeof fieldValue === "string" ? fieldValue.trim() : "";
}

export function validateShippingAddress(
  value: unknown
): ShippingAddressValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      success: false,
      errors: {
        fullName: "Enter the recipient's full name.",
        addressLine1: "Enter a street address.",
        city: "Enter a city.",
        state: "Enter a state.",
        postalCode: "Enter a ZIP code.",
        country: "Select a supported country.",
      },
    };
  }

  const address = value as Record<string, unknown>;
  const fullName = getTrimmedString(address, "fullName");
  const addressLine1 = getTrimmedString(address, "addressLine1");
  const addressLine2 = getTrimmedString(address, "addressLine2");
  const city = getTrimmedString(address, "city");
  const state = getTrimmedString(address, "state");
  const postalCode = getTrimmedString(address, "postalCode");
  const country = getTrimmedString(address, "country");
  const errors: ShippingAddressErrors = {};

  if (fullName.length < 2) {
    errors.fullName = "Enter the recipient's full name.";
  } else if (fullName.length > SHIPPING_ADDRESS_LIMITS.fullName) {
    errors.fullName = `Full name must be ${SHIPPING_ADDRESS_LIMITS.fullName} characters or fewer.`;
  }

  if (addressLine1.length < 5) {
    errors.addressLine1 = "Enter a complete street address.";
  } else if (
    addressLine1.length > SHIPPING_ADDRESS_LIMITS.addressLine1
  ) {
    errors.addressLine1 = `Street address must be ${SHIPPING_ADDRESS_LIMITS.addressLine1} characters or fewer.`;
  }

  if (addressLine2.length > SHIPPING_ADDRESS_LIMITS.addressLine2) {
    errors.addressLine2 = `Apartment or suite must be ${SHIPPING_ADDRESS_LIMITS.addressLine2} characters or fewer.`;
  }

  if (city.length < 2) {
    errors.city = "Enter a city.";
  } else if (city.length > SHIPPING_ADDRESS_LIMITS.city) {
    errors.city = `City must be ${SHIPPING_ADDRESS_LIMITS.city} characters or fewer.`;
  }

  if (state.length < 2) {
    errors.state = "Enter a state.";
  } else if (state.length > SHIPPING_ADDRESS_LIMITS.state) {
    errors.state = `State must be ${SHIPPING_ADDRESS_LIMITS.state} characters or fewer.`;
  }

  if (!/^\d{5}(?:-\d{4})?$/.test(postalCode)) {
    errors.postalCode = "Enter a valid 5-digit or ZIP+4 code.";
  }

  if (country !== "US") {
    errors.country = "Shipping is currently available in the United States.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      fullName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country: "US",
    },
  };
}
