import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold">🏡 Dépenses Noury</h1>
      <LoginForm next={typeof next === "string" ? next : "/"} />
    </main>
  );
}
