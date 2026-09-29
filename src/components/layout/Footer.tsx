import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[76rem] flex-col gap-2 px-4 py-6 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>Coffee Calendar · for filter coffee</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span>Every drinking window is an estimate.</span>
          <Link href="/about" className="font-medium underline decoration-border underline-offset-4 hover:text-foreground">How the model works</Link>
        </div>
      </div>
    </footer>
  );
}
