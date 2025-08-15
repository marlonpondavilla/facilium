"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { LogIn } from "lucide-react";
import { Alegreya_SC, DM_Sans } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";

const alegreyaSC = Alegreya_SC({
	subsets: ["latin"],
	weight: ["400", "700"],
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	weight: ["400", "700"],
});

const discoverFaciliumContent = [
	{
		title: "Scheduling",
		img: "/icons/scheduling.png",
	},
	{
		title: "Accessibility",
		img: "/icons/accessibility.png",
	},
	{
		title: "Management",
		img: "/icons/management.png",
	},
	{
		title: "Efficiency",
		img: "/icons/efficiency.png",
	},
	{
		title: "Scheduling",
		img: "/icons/automation.png",
	},
	{
		title: "Scheduling",
		img: "/icons/flexibility.png",
	},
	{
		title: "Scheduling",
		img: "/icons/productivity.png",
	},
];

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
					<h1
						className={`${dmSans.className} text-6xl font-bold tracking-wider flex flex-col facilium-color-light-indigo`}
					>
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

			<div className="p-8 facilium-bg-pink relative flex items-center justify-center text-center overflow-hidden">
				<h3
					className={`${alegreyaSC.className} text-5xl facilium-color-white z-10`}
				>
					Bulacan State University - Meneses Campus
				</h3>
				{/* 2nd layer bulsu with image  */}
				<div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
					<Image
						src="/bsu-meneses-bg-logo.png"
						alt="BSU Meneses background logo"
						fill
						className="object-cover"
						priority
					/>
				</div>
			</div>

			{/* 3rd layer with main features */}
			<div className="bg-[url('/landing-bg-line.png')] bg-cover bg-center facilium-bg-landing-pink flex flex-col justify-center items-center pt-[100px]">
				<h4
					className={`${dmSans.className} text-4xl font-semibold tracking-widest mb-8`}
				>
					Vision & Mission
				</h4>
				<div className="grid grid-cols-2 gap-4 w-1/2 border">
					<Card>
						<CardHeader>
							<CardTitle className="text-center">Vision</CardTitle>
						</CardHeader>
						<CardContent
							className={`text-center font-light ${dmSans.className}`}
						>
							Bulacan State University is a progressive knowledge-generating
							institution globally recognized for excellent instruction,
							pioneering research, and responsive community engagements.
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-center">Mission</CardTitle>
						</CardHeader>
						<CardContent
							className={`text-center font-light ${dmSans.className}`}
						>
							Bulacan State University exists to produce highly competent,
							ethical and service-oriented professionals that contribute to the
							sustainable socio-economic growth and development of the nation.
						</CardContent>
					</Card>
				</div>
				{/* carousel and features */}
				<div className="mt-[100px] flex flex-col justify-center items-center gap-6 mb-10">
					<h5
						className={`${dmSans.className} text-4xl md:text-6xl font-bold text-center`}
					>
						Discover Facilium
					</h5>

					<Carousel
						opts={{ loop: true }}
						plugins={[Autoplay({ delay: 1000 })]}
						className="w-full max-w-full px-4 "
					>
						<CarouselContent className="-ml-4">
							{discoverFaciliumContent.map((content, key) => (
								<CarouselItem
									key={key}
									className="pl-4 md:basis-1/3 sm:basis-1/2 basis-full"
								>
									<Card className="h-full">
										<CardHeader className="flex items-center justify-center">
											<Image
												src={content.img}
												height={50}
												width={50}
												alt={`${content.title} icon`}
												className="w-14 h-14 object-contain"
											/>
										</CardHeader>
										<CardContent className="text-center">
											<CardTitle className="text-lg font-semibold">
												{content.title}
											</CardTitle>
										</CardContent>
									</Card>
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>
				</div>
				<p className={`p-15 tracking-widest font-light italic underline`}>
					Plotting every schedule work for you, not against you.
				</p>
			</div>
			<footer className="facilium-bg-pink p-8 relative flex justify-center">
				<Image
					src={"/facilium-logo-black.png"}
					width={60}
					height={60}
					alt="Facilium logo"
					className="bg-white rounded-xl absolute top-[-25px]"
				/>
			</footer>
		</>
	);
}
