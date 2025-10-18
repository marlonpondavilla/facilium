"use client";

import AdminHeaderTitle from "@/components/admin-header-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	addDocumentToFirestore,
	incrementDocumentCountById,
} from "@/data/actions";
import { departments } from "@/data/department";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type ClassroomComponentProps = {
	children: React.ReactNode;
};

const ClassroomComponent = ({ children }: ClassroomComponentProps) => {
	const router = useRouter();
	const [classroomName, setClassroomName] = useState("");
	const [status, setStatus] = useState("Enabled");
	const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [errors, setErrors] = useState({
		classroomName: false,
		departments: false,
	});
	const { id } = useParams();

	// Handle department checkbox changes
	const handleDepartmentChange = (department: string, checked: boolean) => {
		setSelectedDepartments((prev) => {
			if (checked) {
				return [...prev, department];
			} else {
				return prev.filter((dept) => dept !== department);
			}
		});
		// Clear department error when user selects at least one
		if (checked && errors.departments) {
			setErrors((prev) => ({ ...prev, departments: false }));
		}
	};

	// Handle select all departments
	const handleSelectAllDepartments = (checked: boolean) => {
		if (checked) {
			setSelectedDepartments([...departments]);
		} else {
			setSelectedDepartments([]);
		}
		// Clear department error when user selects all
		if (checked && errors.departments) {
			setErrors((prev) => ({ ...prev, departments: false }));
		}
	};

	// Clear classroom name error when user types
	const handleClassroomNameChange = (value: string) => {
		setClassroomName(value);
		if (value.trim() && errors.classroomName) {
			setErrors((prev) => ({ ...prev, classroomName: false }));
		}
	};

	// Handle dialog open/close
	const handleDialogOpenChange = (open: boolean) => {
		setDialogOpen(open);
		if (!open) {
			// Reset form when dialog closes
			setClassroomName("");
			setSelectedDepartments([]);
			setStatus("Enabled");
			setErrors({ classroomName: false, departments: false });
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);

		// Reset errors
		setErrors({ classroomName: false, departments: false });

		// Validation
		const newErrors = {
			classroomName: classroomName.trim() === "",
			departments: selectedDepartments.length === 0,
		};

		if (newErrors.classroomName || newErrors.departments) {
			setErrors(newErrors);
			setSubmitting(false);

			if (newErrors.classroomName) {
				toast.error("Classroom name cannot be empty");
			}
			if (newErrors.departments) {
				toast.error("Please select at least one department");
			}
			return;
		}

		try {
			const result = await addDocumentToFirestore("classrooms", {
				buildingId: id,
				classroomName: classroomName,
				departments: selectedDepartments,
				status: status,
				created: new Date().toISOString(),
			});

			if (result.success) {
				if (id) {
					// add 1 to the building's classroom based on the route (id params)
					await incrementDocumentCountById(
						id?.toString(),
						"buildings",
						"classroom",
						1
					);
				}
				toast.success("New classroom has been added!");
				// Reset form and close dialog
				setClassroomName("");
				setSelectedDepartments([]);
				setStatus("Enabled");
				setErrors({ classroomName: false, departments: false });
				setDialogOpen(false);
				router.refresh();
			} else {
				toast.error("Error on adding a classroom");
			}
		} catch (e: unknown) {
			const error = e as { message?: string };
			toast.error(
				error.message ?? "There is an error when submitting the form"
			);
			console.error(error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.back()}
					className="inline-flex items-center gap-1 px-2"
				>
					<ChevronLeft className="w-4 h-4" />
					Back
				</Button>
			</div>
			<AdminHeaderTitle title="Building Details" />
			{/* Header Section - Responsive */}
			<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h1 className="text-xl sm:text-2xl tracking-wide font-semibold text-gray-700">
						Classrooms
					</h1>
					<div className="flex-shrink-0">
						<Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
							<DialogTrigger asChild>
								<Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2">
									Add New Classroom
								</Button>
							</DialogTrigger>

							<DialogContent className="sm:max-w-[500px]">
								<form onSubmit={handleSubmit} className="space-y-6">
									<DialogHeader>
										<DialogTitle className="text-xl font-semibold text-gray-800">
											Create New Classroom
										</DialogTitle>
										<DialogDescription className="text-gray-600">
											Add a new classroom with assigned departments. This will
											be available for faculty scheduling.
										</DialogDescription>
									</DialogHeader>

									{/* Classroom Name */}
									<div className="space-y-2">
										<Label
											htmlFor="classroom-name"
											className="text-sm font-medium text-gray-700"
										>
											Classroom Name <span className="text-red-500">*</span>
										</Label>
										<Input
											id="classroom-name"
											placeholder="e.g., Room 101, Lab A, etc."
											value={classroomName}
											onChange={(e) =>
												handleClassroomNameChange(e.target.value)
											}
											className={`w-full ${
												errors.classroomName
													? "border-red-500 focus:border-red-500 focus:ring-red-500"
													: ""
											}`}
										/>
										{errors.classroomName && (
											<p className="text-sm text-red-600 flex items-center gap-1">
												<span className="text-red-500">⚠</span>
												Classroom name is required
											</p>
										)}
									</div>

									{/* Departments */}
									<div className="space-y-3">
										<Label className="text-sm font-medium text-gray-700">
											Assigned Departments{" "}
											<span className="text-red-500">*</span>
										</Label>
										<div
											className={`rounded-lg p-4 space-y-3 border-2 transition-colors ${
												errors.departments
													? "bg-red-50 border-red-200"
													: "bg-gray-50 border-gray-200"
											}`}
										>
											<div className="flex items-center justify-between">
												<p className="text-sm text-gray-600">
													Select one or more departments that can use this
													classroom:
												</p>
											</div>
											<div className="flex items-center space-x-2">
												<Checkbox
													id="select-all-departments"
													checked={
														selectedDepartments.length === departments.length
													}
													onCheckedChange={(checked) =>
														handleSelectAllDepartments(checked as boolean)
													}
												/>
												<Label
													htmlFor="select-all-departments"
													className="text-sm font-medium text-indigo-600 cursor-pointer"
												>
													Select All
												</Label>
											</div>

											<div className="grid grid-cols-2 gap-3">
												{departments.map((department) => (
													<div
														key={department}
														className="flex items-center space-x-3"
													>
														<Checkbox
															id={`dept-${department}`}
															checked={selectedDepartments.includes(department)}
															onCheckedChange={(checked) =>
																handleDepartmentChange(
																	department,
																	checked as boolean
																)
															}
														/>
														<Label
															htmlFor={`dept-${department}`}
															className="text-sm font-medium text-gray-700 cursor-pointer"
														>
															{department}
														</Label>
													</div>
												))}
											</div>

											{selectedDepartments.length > 0 && (
												<div className="mt-3 pt-3 border-t border-gray-200">
													<p className="text-sm text-indigo-600">
														Selected ({selectedDepartments.length}):{" "}
														{selectedDepartments.join(", ")}
													</p>
												</div>
											)}

											{errors.departments && (
												<div className="mt-3 pt-3 border-t border-red-200">
													<p className="text-sm text-red-600 flex items-center gap-1">
														<span className="text-red-500">⚠</span>
														Please select at least one department
													</p>
												</div>
											)}
										</div>
									</div>

									{/* Status */}
									<div className="space-y-2">
										<Label className="text-sm font-medium text-gray-700">
											Status
										</Label>
										<Select value={status} onValueChange={setStatus}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Enabled">
													<div className="flex items-center gap-2">
														<div className="w-2 h-2 bg-green-500 rounded-full"></div>
														Enabled
													</div>
												</SelectItem>
												<SelectItem value="Disabled">
													<div className="flex items-center gap-2">
														<div className="w-2 h-2 bg-red-500 rounded-full"></div>
														Disabled
													</div>
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<DialogFooter className="flex flex-col sm:flex-row gap-3">
										<DialogClose asChild>
											<Button
												type="button"
												variant="outline"
												className="w-full sm:w-auto"
											>
												Cancel
											</Button>
										</DialogClose>
										<Button
											type="submit"
											className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
											disabled={submitting}
										>
											{submitting ? "Adding..." : "Add Classroom"}
										</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</div>

			{/* Table Content */}
			<Card>
				<CardContent className="p-0">{children}</CardContent>
			</Card>
		</div>
	);
};

export default ClassroomComponent;
