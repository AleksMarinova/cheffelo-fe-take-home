import Link from "next/link";
import { Suspense } from "react";

import { Listings } from "../../components/Listings";
import { FilterNav } from "../../components/FilterNav";

export default function ListingsPage() {
  return (
    <>
      <header className="p-4">
        <Link href="/">&lt; Back to home page</Link>
        <h1 className="mt-4">
          <strong>Listings</strong>
        </h1>
        <Suspense fallback={null}>
          <FilterNav />
        </Suspense>
      </header>

      <main className="p-4">
        <Suspense fallback={<p aria-live="polite">Loading listings…</p>}>
          <Listings />
        </Suspense>
      </main>
    </>
  );
}
