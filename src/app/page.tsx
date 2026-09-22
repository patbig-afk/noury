import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "./depenses/expense-form";
import { Nav } from "./nav";

export default async function NewExpensePage() {
  await connection();
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <Nav current="/" />
      <h1 className="mb-5 text-xl font-semibold">Nouvelle dépense</h1>
      <ExpenseForm categories={categories} today={today} />
    </main>
  );
}
