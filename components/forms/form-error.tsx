export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
      {message}
    </p>
  );
}
