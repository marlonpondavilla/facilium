import Image from "next/image";
import { RegisterForm } from "./register-form";
import { alegreyaSC } from "@/data/fonts";

export default function Signup() {
	return (
		<main className="fixed inset-0 h-screen w-screen overflow-auto bg-[#f7f8fb] text-black">
			<section className="w-full min-h-full flex justify-center px-4 sm:px-8">
				<div className="w-full max-w-md flex flex-col items-center text-center py-10">
					<header className="flex flex-col items-center gap-4">
						<Image
							src="/bsu-meneses-logo.png"
							width={72}
							height={72}
							alt="Bulsu Meneses Logo"
							className="w-16 h-16 sm:w-20 sm:h-20"
							priority
						/>
						<h1
							className={`font-bold leading-tight text-base sm:text-lg md:text-xl text-center ${alegreyaSC.className}`}
						>
							Bulacan State University
							<span className="block">Meneses Campus</span>
						</h1>
					</header>
					<div className="mt-6 mb-6 w-full">
						<p className="tracking-wide font-light text-sm md:text-xl text-neutral-600">
							Create Your Account
						</p>
					</div>
					<RegisterForm />
					<footer className="mt-6 text-xs text-neutral-400">
						<span>Facilium • Secure. Manage. Empower.</span>
					</footer>
				</div>
			</section>
		</main>
	);
}
