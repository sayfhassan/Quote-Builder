import { Route, Routes } from 'react-router-dom';
import { useUser } from './context/UserContext';
import { UserSwitcher } from './components/UserSwitcher';
import { Spinner } from './components/Spinner';
import { DocumentIcon } from './components/icons';
import { QuoteListPage } from './pages/QuoteListPage';
import { QuoteEditorPage } from './pages/QuoteEditorPage';

function App() {
  const { loading, error, users } = useUser();

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark">
            <DocumentIcon size={16} />
          </span>
          <h2 className="app__title">Quote Builder</h2>
        </div>
        {users.length > 0 && <UserSwitcher />}
      </header>

      <main className="app__main">
        {loading && (
          <div className="page">
            <Spinner label="Loading…" />
          </div>
        )}
        {error && <p className="page error">{error}</p>}
        {!loading && !error && (
          <Routes>
            <Route path="/" element={<QuoteListPage />} />
            <Route path="/quotes/:id" element={<QuoteEditorPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;
