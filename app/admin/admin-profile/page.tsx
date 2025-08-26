import AdminSideBar from "@/components/admin-side-bar";
import LogoutAuthButton from "@/components/logout";

const Page = () => {
	return (
		<AdminSideBar>
			<div className="admin-profile-container flex justify-center flex-col items-center h-screen gap-4">
				<h1 className="text-2xl">Admin Profile</h1>
				<LogoutAuthButton />
			</div>
		</AdminSideBar>
	);
};

export default Page;
