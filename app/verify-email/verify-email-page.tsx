"use client";

import { useEffect, useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const VerifyEmailPage = () => {
	const { user, loading } = useAuth() || {};
	const [resent, setResent] = useState(false);
	const router = useRouter();

	useEffect(() => {
		// If already verified, redirect to dashboard or login
		if (user?.emailVerified) {
			toast.success("Email already verified.");
			router.push("/login");
		}
	}, [user, router]);

	const handleResend = async () => {
		if (!user) return;
		try {
			await sendEmailVerification(user, {
				url: `${window.location.origin}/login`,
			});
			toast.success("Verification email resent.");
			setResent(true);
		} catch (error) {
			toast.error("Failed to resend verification email.");
			console.error(error);
		}
	};

	const handleGoToLogin = () => {
		router.push("/login");
	};

	if (loading) return <p>Loading...</p>;

	return (
		<div className="max-w-md mx-auto mt-20 text-center">
			<h1 className="text-2xl font-semibold mb-4">Verify Your Email</h1>
			<p className="mb-6">
				We’ve sent a verification email to <strong>{user?.email}</strong>.
				Please check your inbox (and spam folder) to verify your email address.
			</p>
			<div className="flex justify-center gap-2 my-4 ">
				<ArrowLeft />
				<p onClick={handleGoToLogin} className="cursor-pointer">
					Go back to login
				</p>
			</div>
			<Button
				onClick={handleResend}
				className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
				disabled={resent}
			>
				{resent ? "Email Sent!" : "Resend Verification Email"}
			</Button>
		</div>
	);
};

export default VerifyEmailPage;
