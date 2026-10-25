export default function Timeline({ events = [] }) {
  return <ol>{events.map((event) => <li key={event.id}>{event.message}</li>)}</ol>;
}

