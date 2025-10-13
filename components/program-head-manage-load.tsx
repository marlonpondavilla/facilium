"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { facultyLoadSchema, FacultyLoadForm } from "@/validation/facultyLoadSchema";
import { addFacultyLoad, deleteFacultyLoad, getFacultyLoads, updateFacultyLoad } from "@/data/actions";
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
import { ArrowLeft, Undo } from "lucide-react";
import WarningPopUp from "./warning-pop-up";

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
  // Separate saving vs list loading to avoid UI appearing stuck
  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [loads, setLoads] = useState<FacultyLoad[]>([]);
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnTitle, setWarnTitle] = useState("");
  const [warnDesc, setWarnDesc] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const programId = params.get("programId") || "";
  const yearLevelId = params.get("yearLevelId") || "";
  const sectionId = params.get("sectionId") || "";
  const loadId = params.get("loadId") || "";

  const form = useForm<FacultyLoadForm>({
    resolver: zodResolver(facultyLoadSchema),
    defaultValues: { programId: "", yearLevelId: "", sectionId: "", courseCode: "", professorId: "" },
  });

  // When loadId changes, prefill the form with selected load values
  useEffect(() => {
    if (!loadId) return;
    const selected = loads.find((l) => l.id === loadId);
    if (!selected) return;
    form.setValue("programId", selected.programId);
    form.setValue("yearLevelId", selected.yearLevelId);
    form.setValue("sectionId", selected.sectionId);
    form.setValue("courseCode", selected.courseCode);
    form.setValue("professorId", selected.professorId);
  }, [loadId, loads, form]);

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

  // Static right-side table: always show all loads; do not filter by left-side selections
  const refreshLoads = useCallback(async () => {
    setListLoading(true);
    try {
      const res = (await getFacultyLoads()) as unknown as Array<FacultyLoad & { id?: string }>;
      setLoads(res as FacultyLoad[]);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  }, []);

  // If selected loadId no longer exists (deleted), clear selection from URL
  useEffect(() => {
    if (loadId && !loads.some((l) => l.id === loadId)) {
      setQuery({ loadId: null });
    }
  }, [loads, loadId]);

  // Sort loads by professor name (First Last), case-insensitive, fallback to professorId
  const sortedLoads = useMemo(() => {
    const withKeys = loads.map((l) => {
      const prof = professors.find((p) => p.id === l.professorId);
      const name = prof ? `${prof.firstName} ${prof.lastName}` : l.professorId;
      return { item: l, key: (name || '').toLowerCase() };
    });
    withKeys.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    return withKeys.map((w) => w.item);
  }, [loads, professors]);

  // Clamp page when loads change
  const totalPages = Math.max(1, Math.ceil(sortedLoads.length / pageSize));
  useEffect(() => {
    if (page > 0 && page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [sortedLoads, totalPages, page]);

  // Jump to the page containing the selected loadId for better UX
  useEffect(() => {
    if (!loadId) return;
    const idx = sortedLoads.findIndex((l) => l.id === loadId);
    if (idx >= 0) {
      const p = Math.floor(idx / pageSize);
      if (p !== page) setPage(p);
    }
  }, [loadId, sortedLoads, page]);

  const pagedLoads = useMemo(() => {
    const start = page * pageSize;
    return sortedLoads.slice(start, start + pageSize);
  }, [sortedLoads, page]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await refreshLoads();
    })();
    return () => {
      mounted = false;
    };
  }, [refreshLoads]);

  const onSubmit = async (values: FacultyLoadForm) => {
    setSaving(true);
    // Safety timeout to avoid indefinite spinner in case of network hang
    const timeout = setTimeout(() => setSaving(false), 15000);
    try {
      // Client-side duplicate guard: disallow same professor + program + yearLevel + section + courseCode
      const existsSame = loads.some(
        (l) =>
          l.professorId === values.professorId &&
          l.programId === values.programId &&
          l.yearLevelId === values.yearLevelId &&
          l.sectionId === values.sectionId &&
          l.courseCode === values.courseCode &&
          (!loadId || l.id !== loadId)
      );
      if (existsSame) {
        setWarnTitle("Duplicate load for this professor");
        setWarnDesc("This professor already has this exact assignment. Assign a different professor or change the course/section.");
        setWarnOpen(true);
        return;
      }
      if (loadId) {
        // Optimistic update for update
        setLoads((prev) =>
          prev.map((l) => (l.id === loadId ? { ...l, ...values } as FacultyLoad : l))
        );
        const result = await updateFacultyLoad(loadId, {
          professorId: values.professorId,
          programId: values.programId,
          yearLevelId: values.yearLevelId,
          sectionId: values.sectionId,
          courseCode: values.courseCode,
        });
        if (result.success) {
          toast.success("Faculty load updated");
          await refreshLoads();
          // Clear URL params and reset form after update (return to add mode)
          setQuery({ programId: null, yearLevelId: null, sectionId: null, loadId: null });
          form.reset({ programId: "", yearLevelId: "", sectionId: "", courseCode: "", professorId: "" });
        } else {
          // Revert optimistic change on failure
          await refreshLoads();
          const msg = typeof result.error === 'string' ? result.error : 'Failed to update load';
          if (typeof result.error === 'string' && result.error.toLowerCase().includes('duplicate')) {
            setWarnTitle("Duplicate load for this professor");
            setWarnDesc("This professor already has this exact assignment. Assign a different professor or change the course/section.");
            setWarnOpen(true);
          } else {
            toast.error(msg);
          }
        }
      } else {
        // Optimistic add
        const optimistic = {
          id: `optimistic-${Date.now()}`,
          professorId: values.professorId,
          programId: values.programId,
          yearLevelId: values.yearLevelId,
          sectionId: values.sectionId,
          courseCode: values.courseCode,
        } as unknown as FacultyLoad;
        setLoads((prev) => [optimistic, ...prev]);
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
          setQuery({ programId: null, yearLevelId: null, sectionId: null, loadId: null });
          form.reset({ programId: "", yearLevelId: "", sectionId: "", courseCode: "", professorId: "" });
          // Refresh list to include the newly added load
          await refreshLoads();
        } else {
          // Revert optimistic add on failure
          setLoads((prev) => prev.filter((l) => !(l.id && l.id.toString().startsWith("optimistic-"))));
          const msg = typeof result.error === 'string' ? result.error : 'Failed to add load';
          if (typeof result.error === 'string' && result.error.toLowerCase().includes('duplicate')) {
            setWarnTitle("Duplicate load for this professor");
            setWarnDesc("This professor already has this exact assignment. Assign a different professor or change the course/section.");
            setWarnOpen(true);
          } else {
            toast.error(msg);
          }
        }
      }
    } catch (e) {
      console.error(e);
      // Re-sync from server on error
      await refreshLoads();
      toast.error("Failed to add load");
    } finally {
      clearTimeout(timeout);
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      // Optimistic remove
      setLoads((prev) => prev.filter((l) => l.id !== id));
      await deleteFacultyLoad(id);
      toast.success("Load removed");
      await refreshLoads();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete load");
      // Re-sync from server on error
      await refreshLoads();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-5 flex flex-col gap-3">
      <div className="facilium-bg-whiter p-4 rounded-xl border">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h1 className="text-xl font-semibold facilium-color-indigo">Manage Faculty Load</h1>
          <Button
            type="button"
            variant="outline"
            className="h-8 px-3 text-xs border border-gray-500"
            onClick={() => router.push('/program-head')}
          >
            <ArrowLeft />
            Back to Home
          </Button>
        </div>
        <p className="text-sm text-gray-600">* Assign courses/sections to professors. These assignments will restrict professor choices during schedule plotting.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.2fr] gap-3">
        <div className="facilium-bg-whiter p-3 rounded-xl border">
          <h2 className="text-base font-semibold mb-4">Create Assignment Loads</h2>
          {loadId && (
            <div className="mb-3 flex items-start justify-between gap-2 rounded border border-pink-300 bg-pink-50 p-2 text-sm">
              <div className="space-y-0.5">
                <div className="font-medium text-pink-700">Editing selected load</div>
                {(() => {
                  const selected = loads.find((l) => l.id === loadId);
                  if (!selected) return null;
                  const prof = professors.find((p) => p.id === selected.professorId);
                  const sectionName = sections.find((s) => s.id === selected.sectionId)?.sectionName || selected.sectionId;
                  return (
                    <div className="text-gray-700">
                      Course <span className="font-semibold">{selected.courseCode}</span> — Section <span className="font-semibold">{sectionName}</span>{" "}
                      {prof && (
                        <>
                          — Professor <span className="font-semibold">{prof.firstName} {prof.lastName}</span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-8"
                onClick={() => {
                  // Clear selection only (preserve current filters)
                  const next = new URLSearchParams(params.toString());
                  next.delete("loadId");
                  router.push(`${pathname}?${next.toString()}`);
                }}
              >
                Clear
              </Button>
            </div>
          )}
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
                          disabled={saving}
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
                        <Select value={field.value} onValueChange={field.onChange} disabled={!programId || saving}>
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
                        disabled={!programId || saving}
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
                        disabled={!yearLevelId || saving}
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
                        disabled={!sectionId || saving}
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

              

              <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                <ConfirmationHandleDialog
                  trigger={
                    <Button type="button" className="facilium-bg-indigo h-9 text-sm rounded-full" disabled={saving}>
                      {saving ? "Saving..." : loadId ? "Update Faculty Load" : "Add Faculty Load"}
                    </Button>
                  }
                  title={loadId ? "Confirm updating faculty load" : "Confirm adding faculty load"}
                  description={loadId ? "Please confirm with your password to update this faculty load." : "Please confirm with your password to add this faculty load."}
                  label={loadId ? "Update Faculty Load" : "Add Faculty Load"}
                  requirePassword
                  passwordPlaceholder="Enter your password"
                  onConfirm={async () => {
                    // Validate first; if invalid, keep dialog open
                    const valid = await form.trigger();
                    if (!valid) return false;
                    // Close dialog immediately (by returning true), then perform action async via microtask
                    const vals = form.getValues();
                    Promise.resolve().then(() => onSubmit(vals));
                    return true;
                  }}
                />
                {loadId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 text-sm"
                    onClick={() => {
                      // Clear current selection
                      setQuery({ loadId: null });
                    }}
                  >
                    Clear Selection
                  </Button>
                )}
                  <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => {
                    // Clear URL filters and form
                    setQuery({ programId: null, yearLevelId: null, sectionId: null, loadId: null });
                    form.reset({ programId: "", yearLevelId: "", sectionId: "", courseCode: "", professorId: "" });
                  }}
                    disabled={saving}
                >
                  <Undo />
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="facilium-bg-whiter p-3 rounded-xl border">
          <h2 className="text-base font-semibold mb-4">Current Assignment Loads</h2>
            <div className="space-y-2 text-sm">
              {listLoading && loads.length === 0 && (
                <p className="text-xs text-gray-500">Loading...</p>
              )}
              {sortedLoads.length === 0 ? (
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
                    {pagedLoads.map((l) => {
                      const prof = professors.find((p) => p.id === l.professorId);
                      const course = l.courseCode;
                      const section = sections.find((s) => s.id === l.sectionId)?.sectionName || l.sectionId;
                      return (
                        <TableRow
                          key={l.id}
                          className={`${loadId === l.id ? "bg-pink-100" : "cursor-pointer hover:bg-pink-200"}`}
                          onClick={(e) => {
                            if (!l.id) return;
                            if (saving) return; // avoid selecting while saving
                            const target = e.target as HTMLElement;
                            // Do not select when clicking buttons/links/icons within the row
                            if (target.closest('button, a, [role="button"], [data-no-select]')) return;
                            setQuery({ loadId: l.id, programId: l.programId, yearLevelId: l.yearLevelId, sectionId: l.sectionId });
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{course}</span>
                              {loadId === l.id && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-200 text-pink-800 border border-pink-300">Selected</span>
                              )}
                            </div>
                          </TableCell>
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
                                    disabled={saving}
                                    data-no-select
                                    onClick={(e) => {
                                      // Prevent TableRow onClick from selecting the row
                                      e.stopPropagation();
                                    }}
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
                                  // If the deleted load is selected, clear selection from URL
                                  if (loadId === l.id) setQuery({ loadId: null });
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
              {sortedLoads.length > 0 && (
                <div className="flex items-center justify-between pt-3">
                  <div className="text-xs text-gray-600">
                    Page {page + 1} of {Math.max(1, Math.ceil(sortedLoads.length / pageSize))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
      {/* Warning dialog for duplicates and similar soft errors */}
      <WarningPopUp open={warnOpen} setOpen={setWarnOpen} title={warnTitle} description={warnDesc} />
    </div>
  );
}
