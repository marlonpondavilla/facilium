import AdminSideBar from "@/components/admin-side-bar";
import AdminProfile from "@/components/admin-profile";
import { getCurrentUserData } from "@/data/actions";

type AdminUserProfile = {
	id: string;
	employeeNumber?: string;
	email?: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	degreeEarned?: string;
	designation?: string;
	department?: string;
	photoURL?: string;
	created?: Date | string | { toDate: () => Date } | null;
} | null;

export default async function Page() {
	const user = (await getCurrentUserData()) as AdminUserProfile;
	// The admin profile uses the same fields as faculty but without photo upload controls
	return (
		<AdminSideBar>
			<div className="p-4 w-full">
				<AdminProfile user={user} />
			</div>
		</AdminSideBar>
	);
}
