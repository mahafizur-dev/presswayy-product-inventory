"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState("");

  const go = () => {
    const id = companyId.trim();
    if (id) router.push(`/inventory/${id}`);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--amber)]">
            <Boxes size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text)]">
              Product inventory
            </h1>
            <p className="text-sm text-[var(--text-dim)]">
              Open a company workspace
            </p>
          </div>
        </div>
        <label className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">
          Company ID
        </label>
        <input
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="e.g. f1767d60-ac8c-485a-b89a-ab739cf48f5f"
          className="mb-3 h-10 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--amber)]"
        />
        <button
          onClick={go}
          disabled={!companyId.trim()}
          className="h-10 w-full rounded-md bg-[var(--amber)] text-sm font-semibold text-[#1a1205] hover:bg-[var(--amber-press)] disabled:opacity-50"
        >
          Open inventory
        </button>
      </div>
    </main>
  );
}
