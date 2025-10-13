import { z } from "zod";

export const facultyLoadSchema = z.object({
  professorId: z.string().min(1, "Select professor"),
  programId: z.string().min(1, "Select program"),
  yearLevelId: z.string().min(1, "Select year level"),
  sectionId: z.string().min(1, "Select section"),
  courseCode: z.string().min(1, "Select course"),
});

export type FacultyLoadForm = z.infer<typeof facultyLoadSchema>;
