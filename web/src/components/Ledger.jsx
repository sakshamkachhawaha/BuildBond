export default function Ledger({ summary }) {
  return <section><h2>Ledger</h2><pre>{JSON.stringify(summary, null, 2)}</pre></section>;
}

