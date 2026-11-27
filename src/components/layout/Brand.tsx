import Image from 'next/image';
import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-full text-left hover:opacity-80">
      <Image src="/dream-creation/logo.png" alt="" width={44} height={44} className="rounded-full" />
      <span className="font-serif text-base leading-none sm:text-lg">Dream Creation</span>
    </Link>
  );
}
