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
import DashboardAnalyticsChart from "@/components/dashboard-analytics-chart";

type AcademicYearData = {
	startAcademicYear: number;
	endAcademicYear: number;
	term: string;
};

const AdminComponent = ({ academicYears, analytics }: AdminComponentProps) => {
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

			{/* Analytics Overview */}
			{analytics && (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Users</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-semibold">{analytics.users}</p>
							<p className="text-sm text-muted-foreground">Total registered</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Schedules</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-1">
								<p className="text-3xl font-semibold">
									{analytics.schedules.approved}
								</p>
								<p className="text-sm text-muted-foreground">Approved</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Facilities</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-semibold">{analytics.facilities}</p>
							<p className="text-sm text-muted-foreground">Buildings</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Classrooms</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-semibold">{analytics.classrooms}</p>
							<p className="text-sm text-muted-foreground">Total rooms</p>
						</CardContent>
					</Card>

					<Card className="md:col-span-2 xl:col-span-2">
						<CardHeader>
							<CardTitle className="text-base">Courses & Sections</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-3xl font-semibold">{analytics.courses}</p>
									<p className="text-sm text-muted-foreground">Courses</p>
								</div>
								<div>
									<p className="text-3xl font-semibold">{analytics.sections}</p>
									<p className="text-sm text-muted-foreground">Sections</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			<div className="space-y-6">
				{/* Visual Analytics */}
				{analytics && (
					<Card>
						<CardHeader>
							<CardTitle className="text-lg font-semibold text-gray-800">
								Overview
							</CardTitle>
						</CardHeader>
						<CardContent>
							<DashboardAnalyticsChart analytics={analytics} />
						</CardContent>
					</Card>
				)}
				{/* Add Academic Year Section */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-gray-800">
							Add Academic Year
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Desktop and Mobile Responsive Layout */}
						<div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
							{/* Start Year Input */}
							<div className="lg:col-span-2">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Start Year
								</label>
								<Input
									placeholder="e.g., 2025"
									type="number"
									onChange={(e) => {
										setError("");
										const startYear = Number(e.target.value);

										setAcademicYearData((prev) => ({
											...prev,
											startAcademicYear: startYear,
											endAcademicYear: startYear + 1,
										}));
									}}
									className={`w-full ${
										error ? "border-red-500 focus:border-red-500" : ""
									}`}
								/>
							</div>

							{/* Separator */}
							<div className="hidden lg:flex lg:col-span-1 justify-center items-center">
								<div className="flex items-center gap-2 text-gray-500">
									<Minus className="w-4 h-4" />
									<span className="text-sm">to</span>
									<Minus className="w-4 h-4" />
								</div>
							</div>

							{/* End Year Display */}
							<div className="lg:col-span-1">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									End Year
								</label>
								<div className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-center font-medium">
									{academicYearData.startAcademicYear > 1
										? academicYearData.startAcademicYear + 1
										: "---"}
								</div>
							</div>

							{/* Add Button */}
							<div className="lg:col-span-1">
								<Button
									onClick={handleAddAcademicYear}
									className="w-full"
									disabled={academicYearData.startAcademicYear === 0}
								>
									Add Year
								</Button>
							</div>
						</div>

						{/* Mobile Layout Helper Text */}
						<div className="lg:hidden flex items-center justify-center text-gray-500 text-sm">
							<Minus className="w-4 h-4 mr-1" />
							<span>Academic year spans from start year to next year</span>
							<Minus className="w-4 h-4 ml-1" />
						</div>

						{error && (
							<div className="bg-red-50 border border-red-200 rounded-md p-3">
								<p className="text-red-600 text-sm text-center">{error}</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Academic Year and Term Management */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-gray-800">
							Academic Year & Term Management
						</CardTitle>
						<p className="text-sm text-gray-600">
							Manage the current active academic year and term
						</p>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Current Settings Display */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<h4 className="font-medium text-blue-900 mb-2">
									Current Academic Year
								</h4>
								<div className="bg-white border border-blue-300 rounded-md px-3 py-2">
									<span className="text-blue-800 font-medium">
										{activeYearValue || "No active academic year"}
									</span>
								</div>
							</div>

							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<h4 className="font-medium text-green-900 mb-2">
									Current Academic Term
								</h4>
								<div className="bg-white border border-green-300 rounded-md px-3 py-2">
									<span className="text-green-800 font-medium">
										{selectedTerm || "No term selected"}
									</span>
								</div>
							</div>
						</div>

						{/* Change Settings */}
						<div className="border-t pt-6">
							<h4 className="font-medium text-gray-900 mb-4">
								Update Settings
							</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Academic Year Selection */}
								<div className="space-y-2">
									<label className="block text-sm font-medium text-red-600">
										Change Academic Year
									</label>
									<Select
										value={selectedYearValue}
										onValueChange={handleYearChange}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select academic year" />
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

								{/* Academic Term Selection */}
								<div className="space-y-2">
									<label className="block text-sm font-medium text-red-600">
										Change Academic Term
									</label>
									<Select value={selectedTerm} onValueChange={handleTermChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select academic term" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												<SelectItem value="1st">1st Semester</SelectItem>
												<SelectItem value="2nd">2nd Semester</SelectItem>
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
