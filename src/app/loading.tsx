import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
            <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 relative animate-pulse">
                    <Image
                        src="/logo.svg"
                        alt="Loading..."
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <div className="mt-4 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_infinite_100ms]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_infinite_200ms]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1s_infinite_300ms]" />
                </div>
            </div>
        </div>
    );
}
