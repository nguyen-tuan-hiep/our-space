"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  NativeButton,
  NativeInput,
  NativeSelect,
} from "@/components/ui/native-controls";
import { useToast } from "@/components/toast";
import type { User } from "@supabase/supabase-js";
import { createMissingProfile } from "@/app/actions";
import {
  defaultCurrency,
  defaultTimeZone,
  getSupportedCurrencyCodes,
  getUtcTimeZoneOptions,
  normalizeTimeZoneValue,
  supportedCountryCodes,
} from "@/lib/constants";

interface CreateProfileFormProps {
  user: User;
}

export function CreateProfileForm({ user }: CreateProfileFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const browserTimeZone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTimeZone;
  }, []);
  const browserCountry = useMemo(() => {
    const localeParts = navigator.language.split("-");
    return localeParts.length > 1
      ? (localeParts.at(-1)?.toUpperCase() ?? "SG")
      : "SG";
  }, []);
  const countryNames = useMemo(() => {
    return new Intl.DisplayNames(["en"], { type: "region" });
  }, []);
  const currencyOptions = useMemo(() => getSupportedCurrencyCodes(), []);
  const timeZoneOptions = useMemo(() => getUtcTimeZoneOptions(), []);

  return (
    <form
      className="mt-6 grid gap-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await createMissingProfile(formData);
          toast(result.message, {
            variant: result.ok ? "success" : "error",
          });
          if (result.ok) router.refresh();
        });
      }}
    >
      <NativeInput
        required
        name="display_name"
        label="Display name"
        defaultValue={
          user.user_metadata.display_name ?? user.email?.split("@")[0] ?? ""
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <NativeSelect
            name="country_code"
            label="Country"
            defaultValue={
              supportedCountryCodes.includes(
                browserCountry as (typeof supportedCountryCodes)[number],
              )
                ? browserCountry
                : "SG"
            }
          >
            {supportedCountryCodes.map((country) => (
              <option key={country} value={country}>
                {country} - {countryNames.of(country)}
              </option>
            ))}
        </NativeSelect>
        <NativeSelect
            name="currency"
            label="Currency"
            defaultValue={defaultCurrency}
          >
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
        </NativeSelect>
        <NativeInput required name="avatar" label="Emoji" defaultValue="💖" />
      </div>
      <NativeSelect
          name="time_zone"
          label="Time zone"
          defaultValue={normalizeTimeZoneValue(browserTimeZone)}
        >
          {timeZoneOptions.map((timeZone) => (
            <option key={timeZone.value} value={timeZone.value}>
              {timeZone.label}
            </option>
          ))}
      </NativeSelect>
      <NativeButton
        type="submit"
        disabled={pending}
        className="min-h-12"
      >
        {pending ? "Creating profile..." : "Create profile"}
      </NativeButton>
    </form>
  );
}
