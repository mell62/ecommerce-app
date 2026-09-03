import type {
  ShippingAddress,
  ShippingAddressErrors,
  ShippingAddressField,
} from "@/lib/shipping-address";
import { SHIPPING_ADDRESS_LIMITS } from "@/lib/shipping-address";

type EditableShippingAddressField = Exclude<ShippingAddressField, "country">;

type ShippingAddressFieldsProps = Readonly<{
  address: ShippingAddress;
  errors: ShippingAddressErrors;
  disabled: boolean;
  onChange: (field: EditableShippingAddressField, value: string) => void;
}>;

const inputClassName =
  "mt-2 min-h-11 w-full rounded-ui border border-border bg-surface px-3 py-2 text-foreground outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted/75 focus:border-brand-500 focus:shadow-[0_0_0_2px_var(--color-brand-100)] disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70";

function FieldError({
  id,
  message,
}: Readonly<{ id: string; message?: string }>) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-1.5 text-sm text-danger">
      {message}
    </p>
  );
}

export default function ShippingAddressFields({
  address,
  errors,
  disabled,
  onChange,
}: ShippingAddressFieldsProps) {
  return (
    <section className="rounded-ui border border-border bg-surface p-4 shadow-sm sm:p-6">
      <div className="border-b border-border pb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Shipping address
        </h2>
        <p className="mt-1 text-sm text-muted">
          Enter the address where you would like your order delivered.
        </p>
      </div>

      <fieldset disabled={disabled} className="mt-5 grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Shipping address details</legend>

        <div className="sm:col-span-2">
          <label
            htmlFor="shipping-full-name"
            className="text-sm font-semibold text-foreground"
          >
            Full name
          </label>
          <input
            id="shipping-full-name"
            name="shippingFullName"
            type="text"
            autoComplete="shipping name"
            maxLength={SHIPPING_ADDRESS_LIMITS.fullName}
            value={address.fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? "shipping-full-name-error" : undefined
            }
            className={inputClassName}
          />
          <FieldError id="shipping-full-name-error" message={errors.fullName} />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="shipping-address-line-1"
            className="text-sm font-semibold text-foreground"
          >
            Street address
          </label>
          <input
            id="shipping-address-line-1"
            name="shippingAddressLine1"
            type="text"
            autoComplete="shipping address-line1"
            maxLength={SHIPPING_ADDRESS_LIMITS.addressLine1}
            value={address.addressLine1}
            onChange={(event) => onChange("addressLine1", event.target.value)}
            aria-invalid={Boolean(errors.addressLine1)}
            aria-describedby={
              errors.addressLine1 ? "shipping-address-line-1-error" : undefined
            }
            className={inputClassName}
          />
          <FieldError
            id="shipping-address-line-1-error"
            message={errors.addressLine1}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="shipping-address-line-2"
            className="text-sm font-semibold text-foreground"
          >
            Apartment, suite, or unit{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="shipping-address-line-2"
            name="shippingAddressLine2"
            type="text"
            autoComplete="shipping address-line2"
            maxLength={SHIPPING_ADDRESS_LIMITS.addressLine2}
            value={address.addressLine2}
            onChange={(event) => onChange("addressLine2", event.target.value)}
            aria-invalid={Boolean(errors.addressLine2)}
            aria-describedby={
              errors.addressLine2 ? "shipping-address-line-2-error" : undefined
            }
            className={inputClassName}
          />
          <FieldError
            id="shipping-address-line-2-error"
            message={errors.addressLine2}
          />
        </div>

        <div>
          <label
            htmlFor="shipping-city"
            className="text-sm font-semibold text-foreground"
          >
            City
          </label>
          <input
            id="shipping-city"
            name="shippingCity"
            type="text"
            autoComplete="shipping address-level2"
            maxLength={SHIPPING_ADDRESS_LIMITS.city}
            value={address.city}
            onChange={(event) => onChange("city", event.target.value)}
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "shipping-city-error" : undefined}
            className={inputClassName}
          />
          <FieldError id="shipping-city-error" message={errors.city} />
        </div>

        <div>
          <label
            htmlFor="shipping-state"
            className="text-sm font-semibold text-foreground"
          >
            State
          </label>
          <input
            id="shipping-state"
            name="shippingState"
            type="text"
            autoComplete="shipping address-level1"
            maxLength={SHIPPING_ADDRESS_LIMITS.state}
            value={address.state}
            onChange={(event) => onChange("state", event.target.value)}
            aria-invalid={Boolean(errors.state)}
            aria-describedby={errors.state ? "shipping-state-error" : undefined}
            className={inputClassName}
          />
          <FieldError id="shipping-state-error" message={errors.state} />
        </div>

        <div>
          <label
            htmlFor="shipping-postal-code"
            className="text-sm font-semibold text-foreground"
          >
            ZIP code
          </label>
          <input
            id="shipping-postal-code"
            name="shippingPostalCode"
            type="text"
            inputMode="numeric"
            autoComplete="shipping postal-code"
            maxLength={10}
            value={address.postalCode}
            onChange={(event) => onChange("postalCode", event.target.value)}
            aria-invalid={Boolean(errors.postalCode)}
            aria-describedby={
              errors.postalCode ? "shipping-postal-code-error" : undefined
            }
            className={inputClassName}
          />
          <FieldError
            id="shipping-postal-code-error"
            message={errors.postalCode}
          />
        </div>

        <div>
          <label
            htmlFor="shipping-country"
            className="text-sm font-semibold text-foreground"
          >
            Country
          </label>
          <input
            id="shipping-country"
            name="shippingCountry"
            type="text"
            autoComplete="shipping country-name"
            value="United States"
            readOnly
            className={`${inputClassName} cursor-default bg-surface-muted`}
          />
          <p className="mt-1.5 text-xs text-muted">
            Zeus currently ships within the United States.
          </p>
        </div>
      </fieldset>
    </section>
  );
}
