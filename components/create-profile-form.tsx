"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { useSnackbar } from "notistack";
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
  const { enqueueSnackbar } = useSnackbar();
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
          enqueueSnackbar(result.message, {
            variant: result.ok ? "success" : "error",
          });
          if (result.ok) router.refresh();
        });
      }}
    >
      <TextField
        required
        name="display_name"
        label="Display name"
        defaultValue={
          user.user_metadata.display_name ?? user.email?.split("@")[0] ?? ""
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <FormControl fullWidth>
          <InputLabel id="create-profile-country-label">Country</InputLabel>
          <Select
            labelId="create-profile-country-label"
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
              <MenuItem key={country} value={country}>
                {country} - {countryNames.of(country)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="create-profile-currency-label">Currency</InputLabel>
          <Select
            labelId="create-profile-currency-label"
            name="currency"
            label="Currency"
            defaultValue={defaultCurrency}
          >
            {currencyOptions.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField required name="avatar" label="Emoji" defaultValue="💖" />
      </div>
      <FormControl fullWidth>
        <InputLabel id="create-profile-time-zone-label">Time zone</InputLabel>
        <Select
          labelId="create-profile-time-zone-label"
          name="time_zone"
          label="Time zone"
          defaultValue={normalizeTimeZoneValue(browserTimeZone)}
        >
          {timeZoneOptions.map((timeZone) => (
            <MenuItem key={timeZone.value} value={timeZone.value}>
              {timeZone.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        type="submit"
        variant="contained"
        disabled={pending}
        className="min-h-12 text-white hover:bg-neutral-700"
      >
        {pending ? "Creating profile..." : "Create profile"}
      </Button>
    </form>
  );
}
