import { getDocumentsFromFirestore } from "@/data/actions";
import AdminComponent from "../(admin-components)/admin-component";
import { AcademicYear } from "@/types/academicYearType";

const Page = async () => {
	const academicYears = await getDocumentsFromFirestore<AcademicYear>(
		"academic-years"
	);

	return <AdminComponent academicYears={academicYears} />;
};

export default Page;
