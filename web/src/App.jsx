import { AuthProvider } from './auth.jsx';

export default function App() {
  return (
    <AuthProvider>
      <main><h1>BuildBond</h1><p>Milestone-based proof-of-work tracking.</p></main>
    </AuthProvider>
  );
}
