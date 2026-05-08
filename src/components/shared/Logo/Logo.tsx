import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center justify-center"
    >
      <Image
        src="/iconos/logo.jpeg"
        alt="Distribución G&D"
        title="Distribución G&D"
        width={180}
        height={180}
        className="object-contain"
        priority
      />
    </Link>
  );
}