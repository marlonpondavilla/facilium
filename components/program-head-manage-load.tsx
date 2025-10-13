"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { facultyLoadSchema, FacultyLoadForm } from "@/validation/facultyLoadSchema";
import { addFacultyLoad, deleteFacultyLoad, getFacultyLoads } from "@/data/actions";
import type { FacultyLoad } from "@/types/facultyLoadType";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import ConfirmationHandleDialog from "@/components/confirmation-handle-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Program = { id: string; programCode: string; department?: string };
type YearLevel = { id: string; programId: string; yearLevel: string };
type Section = { id: string; yearLevelId: string; sectionName: string };
type Course = { id: string; termId: string; yearLevelId: string; courseCode: string };
type Term = { id: string; programId: string; yearLevelId: string; term: string };
type Professor = { id: string; designation: string; firstName: string; lastName: string; department?: string };

type Props = {
  programs: Program[];
  yearLevels: YearLevel[];
  sections: Section[];
  courses: Course[];
  academicTerms: Term[];
  professors: Professor[];
  academicYears: { id: string; startAcademicYear: string; endAcademicYear: string; term: string; isActive: boolean }[];
};

export default function ProgramHeadManageLoad(props: Props) {
  const { programs, yearLevels, sections, courses, academicTerms, professors, academicYears } = props;
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [loads, setLoads] = useState<FacultyLoad[]>([]);

  const programId = params.get("programId") || "";
  const yearLevelId = params.get("yearLevelId") || "";
  const sectionId = params.get("sectionId") || "";

  const form = useForm<FacultyLoadForm>({
    resolver: zodResolver(facultyLoadSchema),
    defaultValues: { programId: "", yearLevelId: "", sectionId: "", courseCode: "", professorId: "" },
  });

  const filteredYearLevels = useMemo(
    () => yearLevels.filter((y) => y.programId === programId),
    [yearLevels, programId]
  );
  const filteredSections = useMemo(
    () => sections.filter((s) => s.yearLevelId === yearLevelId),
    [sections, yearLevelId]
  );

  // Selected program (for department-based filtering)
  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === programId),
    [programs, programId]
  );

  // Filter courses by active academic year term (matching schedule behavior)
  const activeAY = useMemo(() => academicYears.find((y) => y.isActive), [academicYears]);
  const matchingTerm = useMemo(
    () => academicTerms.find((t) => t.yearLevelId === yearLevelId && (!activeAY || t.term.trim().toLowerCase() === activeAY.term.trim().toLowerCase())),
    [academicTerms, yearLevelId, activeAY]
  );
  const filteredCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.yearLevelId === yearLevelId && (!matchingTerm || c.termId === matchingTerm.id)
      ),
    [courses, yearLevelId, matchingTerm]
  );

  const filteredProfessors = useMemo(() => {
    const dept = selectedProgram?.department?.trim();
    if (!dept) return [];
    return professors.filter((p) => {
      if (p.designation === "Admin") return false;
      return (p.department || "").trim() === dept;
    });
  }, [professors, selectedProgram]);

  // Clear professor if it's not valid for the selected program's department
  useEffect(() => {
    const currentProf = form.getValues("professorId");
    if (currentProf && !filteredProfessors.some((p) => p.id === currentProf)) {
      form.setValue("professorId", "");
    }
  }, [programId, filteredProfessors, form]);

  const setQuery = (kv: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(kv).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    router.push(`${pathname}?${next.toString()}`);
  };

  // Load existing faculty loads for current filter (program/year/section). If no filters, show all loads.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let res: Array<FacultyLoad & { id?: string }> = [];
        if (sectionId) {
          res = (await getFacultyLoads({ programId, yearLevelId, sectionId })) as unknown as Array<FacultyLoad & { id?: string }>;
        } else if (yearLevelId) {
          res = (await getFacultyLoads({ programId, yearLevelId })) as unknown as Array<FacultyLoad & { id?: string }>;
        } else if (programId) {
          res = (await getFacultyLoads({ programId })) as unknown as Array<FacultyLoad & { id?: string }>;
        } else {
          res = (await getFacultyLoads()) as unknown as Array<FacultyLoad & { id?: string }>;
        }
        if (!cancelled) setLoads(res as FacultyLoad[]);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId, yearLevelId, sectionId]);

  const onSubmit = async (values: FacultyLoadForm) => {
    setLoading(true);
    try {
      const result = await addFacultyLoad({
        professorId: values.professorId,
        programId: values.programId,
        yearLevelId: values.yearLevelId,
        sectionId: values.sectionId,
        courseCode: values.courseCode,
      });
      if (result.success) {
        toast.success("Faculty load added");
        // Clear URL filters and form labels back to placeholders
        setQuery({ programId: null, yearLevelId: null, sectionId: null });
        form.reset({ programId: "", yearLevelId: "", sectionId: "", courseCode: "", professorId: "" });
        // Immediately clear current list view
        setLoads([]);
      } else {
        toast.error("Failed to add load");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to add load");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteFacultyLoad(id);
      toast.success("Load removed");
      const updated = await getFacultyLoads({ programId, yearLevelId, sectionId });
      setLoads(updated as unknown as FacultyLoad[]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete load");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-5 flex flex-col gap-3">
      <div className="facilium-bg-whiter p-3 rounded-xl border">
        <h1 className="text-xl font-semibold facilium-color-indigo mb-1.5">Manage Faculty Load</h1>
        <p className="text-sm text-gray-600">Assign courses/sections to professors. These assignments will restrict professor choices during schedule plotting.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.2fr] gap-3">
        <div className="facilium-bg-whiter p-3 rounded-xl border">
          <h2 className="text-base font-semibold mb-2">Create Assignment</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              {/* Program and Professor side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-6">
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="mb-1 text-sm">Program</FormLabel>
                      <div className="min-w-0">
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            setQuery({ programId: v, yearLevelId: null, sectionId: null });
                            // Reset dependent selects and clear professor for new department
                            form.setValue("yearLevelId", "");
                            form.setValue("sectionId", "");
                            form.setValue("courseCode", "");
                            form.setValue("professorId", "");
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full h-9">
                              <SelectValue placeholder="Select Program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.programCode}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="professorId"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="mb-1 text-sm">Professor</FormLabel>
                      <div className="min-w-0">
                        <Select value={field.value} onValueChange={field.onChange} disabled={!programId}>
                          <FormControl>
                            <SelectTrigger className="w-full h-9 truncate">
                              <SelectValue placeholder="Select Professor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              {filteredProfessors.length === 0 ? (
                                <SelectItem disabled value="no-professors">
                                  {programId ? "No professors in this department" : "Select Program first"}
                                </SelectItem>
                              ) : (
                                filteredProfessors.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="yearLevelId"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <div className="flex items-center gap-3">
                      <FormLabel className="w-24 shrink-0 text-sm">Year Level</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          setQuery({ yearLevelId: v, sectionId: null });
                          form.setValue("sectionId", "");
                          form.setValue("courseCode", "");
                          // Professor selection is independent; no need to clear it
                        }}
                        disabled={!programId}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Select Year Level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {filteredYearLevels.map((y) => (
                              <SelectItem key={y.id} value={y.id}>
                                {y.yearLevel}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <div className="flex items-center gap-3">
                      <FormLabel className="w-24 shrink-0 text-sm">Section</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          setQuery({ sectionId: v });
                          form.setValue("courseCode", "");
                          // Professor selection is independent; no need to clear it
                        }}
                        disabled={!yearLevelId}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Select Section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {filteredSections.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.sectionName}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseCode"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <div className="flex items-center gap-3">
                      <FormLabel className="w-24 shrink-0 text-sm">Course</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!sectionId}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Select Course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {filteredCourses.length ? (
                              filteredCourses.map((c) => (
                                <SelectItem key={c.id} value={c.courseCode}>
                                  {c.courseCode}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem disabled value="no-course">No courses</SelectItem>
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              

              <div className="pt-1.5">
                <ConfirmationHandleDialog
                  trigger={
                    <Button type="button" className="facilium-bg-indigo h-9 text-sm" disabled={loading}>
                      {loading ? "Saving..." : "Add Faculty Load"}
                    </Button>
                  }
                  title="Confirm adding faculty load"
                  description="Please confirm with your password to add this faculty load."
                  label="Add Faculty Load"
                  requirePassword
                  passwordPlaceholder="Enter your password"
                  onConfirm={async () => {
                    const valid = await form.trigger();
                    if (!valid) return false;
                    const vals = form.getValues();
                    await onSubmit(vals);
                    return true;
                  }}
                />
              </div>
            </form>
          </Form>
        </div>

        <div className="facilium-bg-whiter p-3 rounded-xl border">
          <h2 className="text-base font-semibold mb-2">Current Assignments</h2>
            <div className="space-y-2 text-sm">
              {loading && <p className="text-xs text-gray-500">Loading...</p>}
              {loads.length === 0 ? (
                <p className="text-sm text-gray-600">No assignments yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loads.map((l) => {
                      const prof = professors.find((p) => p.id === l.professorId);
                      const course = l.courseCode;
                      const section = sections.find((s) => s.id === l.sectionId)?.sectionName || l.sectionId;
                      return (
                        <TableRow key={l.id}>
                          <TableCell>{course}</TableCell>
                          <TableCell>{section}</TableCell>
                          <TableCell>{prof ? `${prof.firstName} ${prof.lastName}` : l.professorId}</TableCell>
                          <TableCell className="text-right">
                            {l.id && (
                              <ConfirmationHandleDialog
                                trigger={
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={loading}
                                  >
                                    Delete
                                  </Button>
                                }
                                title="Confirm delete"
                                description="Please confirm with your password to delete this faculty load."
                                label="Delete Load"
                                requirePassword
                                passwordPlaceholder="Enter your password"
                                onConfirm={async () => {
                                  await handleDelete(l.id!);
                                  return true;
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
