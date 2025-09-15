import React from "react";
import LoginForm from "./login-form";
import Image from "next/image";

const Login = () => {
	return (
		<main className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden fixed inset-0">
			{/* Left: Light panel with centered form */}
			<section className="w-full lg:w-1/2 h-full bg-[#f7f8fb] text-black flex items-center justify-center px-4 sm:px-8">
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
							Bulacan State University <br className="hidden sm:block" />
							Meneses Campus
						</h1>
					</header>
					<div className="mt-6 mb-6 w-full">
						<p className="tracking-wide font-light mt-3 text-sm md:text-xl text-neutral-600">
							Welcome Back!
						</p>
					</div>
					<div className="w-full">
						<LoginForm />
					</div>
				</div>
			</section>

			{/* Right: Branding panel */}
			<section className="relative hidden lg:flex w-full lg:w-1/2 h-full facilium-bg-pink facilium-color-white items-center justify-center overflow-hidden">
				<div className="flex flex-col items-center gap-10 px-12 py-10 max-w-2xl relative z-10 text-center">
					<div className="flex items-center">
						<Image
							src="/facilium-logo.png"
							width={90}
							height={90}
							alt="Facilium Logo"
							priority
						/>
						<h1 className="text-4xl font-bold ml-5">Facilium</h1>
					</div>
					<h2 className="text-center text-xl leading-relaxed tracking-wide font-medium max-w-xl">
						Secure. Manage. Empower. Your access shapes the system.
					</h2>
				</div>
				<Image
					src="/bsu-meneses-bg-logo.png"
					width={1200}
					height={1200}
					alt="Meneses Watermark Logo"
					className="pointer-events-none select-none opacity-20 absolute -right-32 top-1/2 -translate-y-1/2 w-[1200px] max-w-none"
					priority
				/>
			</section>
		</main>
	);
};

export default Login;
