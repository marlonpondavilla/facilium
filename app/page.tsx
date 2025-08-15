"use client";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();

	return (
		<>
			<div className="relative min-h-screen bg-[url('/bsu-meneses-landing.png')] bg-cover bg-center facilium-bg-landing-pink scroll-smooth">
				{/* navbar */}
				<header className="flex items-center justify-between px-8 py-4">
					<div className="flex items-center">
						<Image
							src="/facilium-logo-black.png"
							alt="Logo"
							width={60}
							height={60}
						/>
						<p className="facilium-color-light-indigo text-xl tracking-wide font-bold ml-2">
							Facilium
						</p>
					</div>

					{/* action buttons */}
					<div className="flex gap-4 items-center">
						<Button
							variant="link"
							onClick={() => router.push("/login")}
							className="flex items-center gap-1 cursor-pointer"
						>
							<p className="text-lg tracking-widest">Login</p>
							<LogIn className="w-50 h-50" />
						</Button>
						<div className="relative inline-flex items-center justify-center gap-4 group">
							<div className="absolute inset-0 duration-1000 opacity-60 transitiona-all bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 rounded-xl blur-lg filter group-hover:opacity-100 group-hover:duration-200"></div>
							<a
								role="button"
								className="group relative inline-flex items-center justify-center text-base rounded-xl bg-gray-900 px-8 py-3 font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-600/30"
								title="payment"
								href="/signup"
							>
								Get Started
								<svg
									aria-hidden="true"
									viewBox="0 0 10 10"
									height="10"
									width="10"
									fill="none"
									className="mt-0.5 ml-2 -mr-1 stroke-white stroke-2"
								>
									<path
										d="M0 5h7"
										className="transition opacity-0 group-hover:opacity-100"
									></path>
									<path
										d="M1 1l4 4-4 4"
										className="transition group-hover:translate-x-[3px]"
									></path>
								</svg>
							</a>
						</div>
					</div>
				</header>

				{/* landing content */}
				<main className="flex flex-col items-center justify-center text-center h-[calc(100vh-80px)] gap-4 relative">
					<h1 className="text-6xl font-bold tracking-wider flex flex-col facilium-color-light-indigo">
						<span>Smart Solutions for</span>
						<span>Smarter Scheduling.</span>
					</h1>
					<h2 className="text-lg mt-2 tracking-wide font-light italic text-gray-700">
						Because scheduling doesn't have to be stressful
					</h2>

					{/* loader placed directly below h2 */}
					<div className="relative w-[160px] h-[100px] mt-6">
						<div className="loader"></div>
						<div className="loader"></div>
						<div className="loader"></div>
					</div>
				</main>
			</div>

			{/* Additional content (if any) */}
			<div>
				<h1>test</h1>
			</div>
		</>
	);
}
