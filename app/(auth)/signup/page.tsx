import Image from "next/image";
import { RegisterForm } from "./register-form";

export default function Signup() {
	return (
		<main className="min-h-screen w-full bg-[#f7f8fb] flex items-center justify-center px-4 sm:px-8 py-10 text-black">
			<div className="w-full max-w-md flex flex-col items-center text-center">
				<header className="flex flex-col items-center gap-4">
					<Image
						src="/bsu-meneses-logo.png"
						width={64}
						height={64}
						alt="Bulsu Meneses Logo"
						className="w-16 h-16"
						priority
					/>
					<h1 className="font-bold leading-tight text-base sm:text-lg md:text-xl">
						Bulacan State University <br />
						Meneses Campus
					</h1>
				</header>
				<div className="mt-5 mb-3 w-full">
					<p className="tracking-wide font-light text-sm md:text-xl text-neutral-600">
						Create Your Account
					</p>
				</div>
				<RegisterForm />
				<footer className="mt-8 text-xs text-neutral-400">
					<span>Facilium • Secure. Manage. Empower.</span>
				</footer>
			</div>
		</main>
	);
}
