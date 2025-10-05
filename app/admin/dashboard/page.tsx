import { getCollectionSize, getDocumentsFromFirestore } from "@/data/actions";
import AdminComponent from "../(admin-components)/admin-component";
import { AcademicYear, AdminAnalytics } from "@/types/academicYearType";

const Page = async () => {
	const academicYears = await getDocumentsFromFirestore<AcademicYear>(
		"academic-years"
	);

	// Gather analytics numbers in parallel for performance
	const [users, approved, facilities, classrooms, courses, sections] =
		await Promise.all([
			getCollectionSize("userData"),
			getCollectionSize("approvedScheduleData"),
			getCollectionSize("buildings"),
			getCollectionSize("classrooms"),
			getCollectionSize("courses"),
			getCollectionSize("sections"),
		]);

	const analytics: AdminAnalytics = {
		users,
		schedules: {
			total: approved,
			planned: 0,
			pending: 0,
			approved,
		},
		facilities, // buildings count
		classrooms,
		courses,
		sections,
	};

	return <AdminComponent academicYears={academicYears} analytics={analytics} />;
};

export default Page;
