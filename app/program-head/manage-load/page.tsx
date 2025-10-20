import FacultyHeader from "@/components/faculty-header";
import ProgramHeadManageLoad from "../../../components/program-head-manage-load";
import { getDocumentsFromFirestore, getCurrentUserData } from "@/data/actions";

// Server component wrapper to feed initial data
export default async function Page() {
  const programs = await getDocumentsFromFirestore<{ id: string; programCode: string; department?: string }>(
    "programs"
  );
  // Filter programs to the current Program Head's department if available
  const currentUser = (await getCurrentUserData()) as { id?: string; department?: string } | null;
  const userDept = currentUser?.department;
  const normalizedDept = userDept?.trim().toLowerCase();
  const filteredPrograms = normalizedDept
    ? programs.filter((p) => (p.department || "").trim().toLowerCase() === normalizedDept)
    : programs;
  const yearLevels = await getDocumentsFromFirestore<{ id: string; programId: string; yearLevel: string }>(
    "year-levels",
    true
  );
  const sections = await getDocumentsFromFirestore<{ id: string; yearLevelId: string; sectionName: string }>(
    "sections"
  );
  const courses = await getDocumentsFromFirestore<{ id: string; termId: string; yearLevelId: string; courseCode: string }>(
    "courses"
  );
  const academicTerms = await getDocumentsFromFirestore<{ id: string; programId: string; yearLevelId: string; term: string }>(
    "academic-terms",
    true
  );
  const professors = await getDocumentsFromFirestore<{ id: string; designation: string; firstName: string; lastName: string; department?: string }>(
    "userData"
  );
  const academicYears = await getDocumentsFromFirestore<{ id: string; startAcademicYear: string; endAcademicYear: string; term: string; isActive: boolean }>(
    "academic-years"
  );

  return (
    <FacultyHeader>
      <ProgramHeadManageLoad
        programs={filteredPrograms}
        yearLevels={yearLevels}
        sections={sections}
        courses={courses}
        academicTerms={academicTerms}
        academicYears={academicYears}
        professors={professors}
        programHeadId={currentUser?.id || ""}
      />
    </FacultyHeader>
  );
}
