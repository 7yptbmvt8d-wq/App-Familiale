import { AppShell } from './components/AppShell';
import { AuthScreen } from './features/auth/AuthScreen';
import { AppProvider, useApp } from './store/AppContext';

function Root() {
  const { ready, session } = useApp();

  if (!ready) {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          height: '100dvh',
          color: 'var(--text-soft)',
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 24,
        }}
      >
        Famille…
      </div>
    );
  }

  return session ? <AppShell /> : <AuthScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
