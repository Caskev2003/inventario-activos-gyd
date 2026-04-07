import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#2b2b2b] via-[#3a3f44] to-[#1f2937]">
      
      {/* Imagen de fondo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/iconos/farmacia-gyd-logo.png"
          alt="Logo"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-contain object-center scale-75 opacity-80" 
          // 🔥 MÁS PEQUEÑO + MÁS SUAVE
        />
      </div>

      {/* Capa oscura suave */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Contenido */}
      <div className="relative flex min-h-screen w-full items-center justify-center lg:justify-start px-4 pr-8 py-5">
        <div className="lg:ml-6 bg-white px-6 md:px-8 py-6 md:py-8 rounded-2xl shadow-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}