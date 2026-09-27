import { Button } from "./Button";

export function ResourceError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="my-4 flex flex-col items-start gap-3">
      <p role="alert" className="text-sm font-medium text-status-not-ready-text">{message}</p>
      <Button variant="secondary" onClick={retry}>Retry</Button>
    </div>
  );
}
