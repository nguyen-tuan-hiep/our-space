"use client";

import { useEffect, useState, useTransition } from "react";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { useSnackbar } from "notistack";
import { createExpense, updateExpense } from "@/app/actions";
import {
	currencySymbols,
	expenseCategories,
	formatCurrencyInputValue,
	formatStoredAmountForInput,
	normalizeGroupedNumberInput,
	supportedCurrencies,
} from "@/lib/constants";
import type { CurrencyCode, IndividualExpense, Profile } from "@/lib/types";

interface ExpenseDialogProps {
	open: boolean;
	onClose: () => void;
	profile: Profile;
	expense?: IndividualExpense | null;
}

export function ExpenseDialog({
	open,
	onClose,
	profile,
	expense,
}: ExpenseDialogProps) {
	const { enqueueSnackbar } = useSnackbar();
	const [pending, startTransition] = useTransition();
	const [transactionDate, setTransactionDate] = useState<dayjs.Dayjs | null>(
		dayjs(),
	);
	const [transactionTime, setTransactionTime] = useState<dayjs.Dayjs | null>(
		dayjs(),
	);
	const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
	const [amount, setAmount] = useState("");
	const handleClose = () => {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onClose();
	};

	const getAmountPayload = (
		value = amount,
		selectedCurrency: CurrencyCode = currency,
	) => {
		return normalizeGroupedNumberInput(
			value,
			selectedCurrency === "VND" ? 0 : 2,
		);
	};

	function getTransactionIso() {
		const dateBase = transactionDate ?? dayjs();
		const timeBase = transactionTime ?? dayjs();

		return dateBase
			.hour(timeBase.hour())
			.minute(timeBase.minute())
			.second(timeBase.second())
			.millisecond(0)
			.toISOString();
	}

	useEffect(() => {
		if (!open) return;

		const nextCurrency = expense?.currency ?? profile.currency;

		const current = expense ? dayjs(expense.transaction_date) : dayjs();

		setTransactionDate(current);
		setTransactionTime(current);
		setCurrency(nextCurrency);
		setAmount(
			expense?.amount !== undefined && expense?.amount !== null
				? formatStoredAmountForInput(expense.amount, nextCurrency)
				: "",
		);
	}, [expense, open, profile.currency]);

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			fullWidth
			maxWidth="sm"
		>
			<DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
				{expense ? "Edit transaction" : "Log expense"}
			</DialogTitle>

			<form
				action={(formData) => {
					const amountDisplay = formData.get("amount_display");

					const displayAmount =
						typeof amountDisplay === "string" ? amountDisplay : amount;

					formData.set("currency", currency);
					formData.set("amount", getAmountPayload(displayAmount, currency));
					formData.set("transaction_date", getTransactionIso());

					if (expense) {
						formData.set("id", expense.id);
					}

					startTransition(async () => {
						const result = expense
							? await updateExpense(formData)
							: await createExpense(formData);

						enqueueSnackbar(result.message, {
							variant: result.ok ? "success" : "error",
						});

						if (result.ok) {
							handleClose();
						}
					});
				}}
			>
				<DialogContent sx={{ p: 3 }}>
					<div className="grid gap-4">
						<TextField
							required
							name="title"
							label="Title"
							defaultValue={expense?.title ?? ""}
						/>

						<input
							type="hidden"
							name="amount"
							value={getAmountPayload(amount, currency)}
						/>

						<div className="grid gap-3 grid-cols-2">
							<TextField
								required
								name="amount_display"
								label={`Amount (${currencySymbols[currency]})`}
								type="text"
								value={amount}
								onChange={(event) => {
									setAmount(
										formatCurrencyInputValue(event.target.value, currency),
									);
								}}
								slotProps={{
									htmlInput: {
										inputMode: "numeric",
									},
								}}
							/>

							<FormControl fullWidth>
								<InputLabel id="currency-label">Currency</InputLabel>
								<Select
									labelId="currency-label"
									id="currency"
									value={currency}
									label="Currency"
									onChange={(event) => {
										const nextCurrency = event.target.value as CurrencyCode;
										const currentPayload = getAmountPayload(amount, currency);

										setCurrency(nextCurrency);
										setAmount(
											currentPayload
												? formatStoredAmountForInput(
														currentPayload,
														nextCurrency,
													)
												: "",
										);
									}}
								>
									{supportedCurrencies.map((option) => (
										<MenuItem
											key={option}
											value={option}
										>
											{option}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</div>

						<div>
							{/* <p className="form-section-label">Transaction date and time</p> */}

							<div className="grid gap-3 grid-cols-2">
								<DatePicker
									format="DD/MM/YYYY"
									label="Date"
									value={transactionDate}
									onChange={(value) => setTransactionDate(value)}
									slotProps={{
										textField: {
											fullWidth: true,
											required: true,
										},
									}}
								/>
								<DesktopTimePicker
									format="HH:mm"
									label="Time"
									value={transactionTime}
									onChange={(value) => setTransactionTime(value)}
									slotProps={{
										textField: {
											fullWidth: true,
											required: true,
										},
									}}
								/>
							</div>
						</div>

						<FormControl
							fullWidth
							required
						>
							<InputLabel id="category-label">Category</InputLabel>
							<Select
								labelId="category-label"
								id="category"
								name="category"
								label="Category"
								defaultValue={expense?.category ?? "Food & Drinks"}
							>
								{expenseCategories.map((category) => (
									<MenuItem
										key={category}
										value={category}
									>
										{category}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<TextField
							multiline
							minRows={3}
							name="notes"
							label="Notes"
							defaultValue={expense?.notes ?? ""}
						/>
					</div>
				</DialogContent>

				<DialogActions sx={{ px: 3, pt: 0, pb: 3 }}>
					<Button onClick={handleClose}>Cancel</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={pending}
					>
						{pending ? "Saving..." : "Save expense"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
