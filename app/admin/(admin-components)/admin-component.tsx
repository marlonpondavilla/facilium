"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	addDocumentToFirestore,
	checkIfDocumentExists,
	updateDocumentsByBatch,
} from "@/data/actions";
import { isValidYear } from "@/lib/utils";
import { AdminComponentProps } from "@/types/academicYearType";
import { Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

type AcademicYearData = {
	startAcademicYear: number;
	endAcademicYear: number;
	term: string;
};

const AdminComponent = ({ academicYears }: AdminComponentProps) => {
	const activeYear = academicYears.find((year) => year.isActive);
	const activeYearValue = activeYear
		? `${activeYear.startAcademicYear}-${activeYear.endAcademicYear}`
		: "";

	// Initialize controlled states from active year/term
	const [selectedYearValue, setSelectedYearValue] =
		useState<string>(activeYearValue);
	const [selectedTerm, setSelectedTerm] = useState<string>(
		activeYear?.term ?? "1st"
	);

	const [academicYearData, setAcademicYearData] = useState<AcademicYearData>({
		startAcademicYear: 0,
		endAcademicYear: 0,
		term: "1st",
	});
	const [error, setError] = useState("");
	const [isChangingAcademicYear, setIsChangingAcademicYear] = useState(false);

	const router = useRouter();

	// Add new academic year handler
	const handleAddAcademicYear = async () => {
		if (academicYearData.startAcademicYear === 0) {
			setError("Start year is required.");
			return;
		}

		if (!isValidYear(String(academicYearData.startAcademicYear))) {
			setError(
				"Please enter valid 4-digit years between current year and after."
			);
			return;
		}

		const isYearExist = await checkIfDocumentExists(
			"academic-years",
			"startAcademicYear",
			academicYearData.startAcademicYear
		);

		if (isYearExist) {
			setError("Start year already existed.");
			return;
		}

		const result = await addDocumentToFirestore("academic-years", {
			...academicYearData,
			created: new Date().toISOString(),
		});

		if (result.success) {
			toast.success("New academic year has been added!");
			window.location.reload();
		}
	};

	// Handle year select change
	const handleYearChange = (value: string) => {
		setSelectedYearValue(value);
		setIsChangingAcademicYear(true);
	};

	// Handle term select change
	const handleTermChange = (value: string) => {
		setSelectedTerm(value);
		setIsChangingAcademicYear(true);
	};

	// Handle setting academic year and term as active in Firestore
	const handleSetAsActive = async () => {
		if (!selectedYearValue) {
			toast.error("Please select an academic year.");
			return;
		}

		const [startYearStr, endYearStr] = selectedYearValue.split("-");
		const startYear = Number(startYearStr);
		const endYear = Number(endYearStr);

		// Find the doc ID of the selected year and current active year
		const selectedYearDoc = academicYears.find(
			(ay) =>
				ay.startAcademicYear === startYear && ay.endAcademicYear === endYear
		);
		const currentActiveYearDoc = academicYears.find((ay) => ay.isActive);

		if (!selectedYearDoc) {
			toast.error("Selected academic year not found.");
			return;
		}

		// Prepare batch updates
		const updates = [];

		// Deactivate current active year if different from selected
		if (
			currentActiveYearDoc &&
			currentActiveYearDoc.id !== selectedYearDoc.id
		) {
			updates.push({
				docId: currentActiveYearDoc.id,
				collectionName: "academic-years",
				data: { isActive: false },
			});
		}

		// Activate selected academic year and update its term
		updates.push({
			docId: selectedYearDoc.id,
			collectionName: "academic-years",
			data: { isActive: true, term: selectedTerm },
		});

		try {
			await updateDocumentsByBatch(updates);
			toast.success("Academic year and term updated successfully!");
			setIsChangingAcademicYear(false);
			router.refresh();
		} catch (error) {
			console.error("Error updating academic year:", error);
			toast.error("Failed to update academic year.");
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<AdminHeaderTitle title="Dashboard" />

			<div className="p-4 flex flex-col gap-4 w-full">
				{/* Add Academic Year Section */}
				<div className="flex flex-col gap-2 bg-white p-4 rounded-xl">
					<p className="font-semibold tracking-wide pb-3">Add Academic Year:</p>
					<div className="flex justify-center gap-4 items-center">
						<p>Start</p>
						<Input
							placeholder="Start (e.g., 2025)"
							onChange={(e) => {
								setError("");
								const startYear = Number(e.target.value);

								setAcademicYearData((prev) => ({
									...prev,
									startAcademicYear: startYear,
									endAcademicYear: startYear + 1,
								}));
							}}
							className={`border ${
								error ? "border-red-500" : "border-black"
							} w-1/4`}
						/>
						<Minus />
						<p>End:</p>
						<p className="bg-muted p-2">
							{academicYearData.startAcademicYear > 1
								? academicYearData.startAcademicYear + 1
								: "---"}
						</p>
						<Button onClick={handleAddAcademicYear}>Add Now</Button>
					</div>
					{error && (
						<p className="text-red-500 text-xs text-center py-2">{error}</p>
					)}
				</div>

				{/* Academic Year and Term Selection */}
				<Card>
					<CardHeader>
						<CardTitle>Select Academic Year:</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="select-container flex flex-col gap-4">
							<div className="select-wrapper flex justify-between">
								<div className="select-label flex items-center gap-2">
									<p>Current Academic Year:</p>
									<p className="underline tracking-wide border bg-muted p-2">
										{activeYearValue || "No active academic year"}
									</p>
								</div>

								<div className="select-item flex items-center gap-2">
									<p className="text-red-400">Change Academic Year:</p>
									<Select
										value={selectedYearValue}
										onValueChange={handleYearChange}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select year" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{academicYears.map((academicYear) => (
													<SelectItem
														key={academicYear.id}
														value={`${academicYear.startAcademicYear}-${academicYear.endAcademicYear}`}
													>
														{`${academicYear.startAcademicYear}-${academicYear.endAcademicYear}`}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="select-wrapper flex justify-between">
								<div className="select-label flex items-center gap-2">
									<p>Current Academic Term:</p>
									<p className="underline tracking-wide border bg-muted p-2">
										{selectedTerm}
									</p>
								</div>

								<div className="select-item flex items-center gap-2">
									<p className="text-red-400">Change Academic Term:</p>
									<Select value={selectedTerm} onValueChange={handleTermChange}>
										<SelectTrigger>
											<SelectValue placeholder="Select term" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectItem value="1st">1st</SelectItem>
												<SelectItem value="2nd">2nd</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</CardContent>

					<CardFooter>
						<div className="flex w-full justify-end">
							<Button
								className="rounded-full"
								variant={"destructive"}
								disabled={!isChangingAcademicYear}
								onClick={handleSetAsActive}
							>
								Set As Active
							</Button>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
};

export default AdminComponent;
