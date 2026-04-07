import Image from 'next/image';

export default function ForgotLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen bg-[#1e1e1e]">

      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Logo centrado */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <Image
          src="/iconos/farmacia-gyd-logo.png"
          alt="Logo G&D"
          width={400}
          height={400}
          className="object-contain"
          priority
        />
      </div>

      {/* Contenido */}
      <div className="relative flex items-center justify-center min-h-screen w-full px-4 py-5">
        <div className="rounded-2xl shadow-lg px-6 md:px-8 py-6 md:py-8 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white/10 backdrop-blur-md border border-white/20">
          {children}
        </div>
      </div>
    </div>
  );
}