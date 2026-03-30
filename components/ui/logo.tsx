import Image from "next/image";
import Link from "next/link";

const Logo = ({ w = "w-20 sm:w-30" }: { w?: string }) => {
	return (
		<Link href="/" className={`flex items-center gap-2 shrink-0 ${w} `}>
			<Image
				alt="Osiso Logo"
				src="/logo.svg"
				height={100}
				width={100}
				className="w-full object-contain"
			/>
		</Link>
	);
};

export default Logo;
