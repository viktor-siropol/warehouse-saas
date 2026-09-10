"use client";

type ProductsErrorProps = {
  error: Error;
  reset: () => void;
};

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  return (
    <div>
      <h2>Could not load products</h2>

      <p>{error.message}</p>

      <button onClick={reset}>Try again</button>
    </div>
  );
}
