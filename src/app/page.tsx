// Página inicial provisória. A interface definitiva será construída na etapa de interface
// (ver docs/DEVELOPMENT_PLAN.md).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Vizinhança Inteligente</h1>
      <p className="text-lg leading-relaxed">
        Uma simulação educacional de inteligência artificial que ajuda você a entender e resolver
        desperdícios de energia em uma vizinhança.
      </p>
      <p
        role="status"
        className="rounded-lg border border-current/20 px-4 py-3 text-base"
      >
        Projeto em desenvolvimento para a feira de ciências.
      </p>
    </main>
  );
}
