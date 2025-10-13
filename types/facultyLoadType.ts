export interface FacultyLoad {
  id?: string;
  professorId: string; // userData doc id of professor
  programId: string;
  yearLevelId: string;
  sectionId: string;
  courseCode: string; // stored as course code string to match schedule
  created: string; // ISO timestamp
}
