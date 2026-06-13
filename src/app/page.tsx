import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-text-primary px-6 py-16 flex flex-col items-center justify-center text-center">
      <Image
        src="/icon.png"
        alt="OutofTheGrid"
        width={280}
        height={84}
        className="h-20 w-auto object-contain mb-8"
        priority
      />
      <p className="text-text-secondary text-lg max-w-2xl mb-10">
        Community italiana per autosufficienza, sostenibilità e crescita locale.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="/login"
          className="bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          Accedi
        </a>
        <a
          href="/register"
          className="border border-accent text-accent hover:bg-accent/10 px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          Registrati
        </a>
      </div>
    </main>
  );
}
