import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "./depenses/expense-form";
import { logout } from "./login/actions";

export default async function NewExpensePage() {
  await connection();
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">🏡 Nouvelle dépense</h1>
        <form action={logout}>
          <button className="text-sm text-stone-500 underline">Déconnexion</button>
        </form>
      </header>
      <ExpenseForm categories={categories} today={today} />
    </main>
  );
}
