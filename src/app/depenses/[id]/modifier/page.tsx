import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isBlobConfigured } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { decimalToCents } from "@/lib/split";
import { ExpenseForm } from "../../expense-form";
import { Nav } from "../../../nav";

export default async function EditExpensePage({ params }: PageProps<"/depenses/[id]/modifier">) {
  await connection();
  const { id } = await params;
  const [expense, categories] = await Promise.all([
    prisma.expense.findUnique({ where: { id } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!expense) notFound();

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <Nav current="/depenses" />
      <h1 className="mb-5 text-xl font-semibold">Modifier la dépense</h1>
      <ExpenseForm
        categories={categories}
        today={today}
        filesEnabled={isBlobConfigured()}
        expense={{
          id: expense.id,
          date: expense.date.toISOString().slice(0, 10),
          categoryId: expense.categoryId,
          description: expense.description,
          supplier: expense.supplier,
          amountCents: decimalToCents(expense.amount),
          paidBy: expense.paidBy,
          kind: expense.kind,
          invoiceName: expense.invoiceName,
          proofName: expense.proofName,
        }}
      />
    </main>
  );
}
