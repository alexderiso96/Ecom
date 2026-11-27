import Image from 'next/image';
import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-full text-left hover:opacity-80">
      <Image src="/dream-creation/logo.png" alt="" width={44} height={44} className="h-9 w-9 shrink-0 rounded-full sm:h-11 sm:w-11" />
      <span className="font-serif text-sm leading-tight sm:text-lg">Dream Creation</span>
    </Link>
  );
}
