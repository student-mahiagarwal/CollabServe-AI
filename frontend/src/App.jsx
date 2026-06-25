import ErrorBoundary from './components/ErrorBoundary.jsx';
import { UserProvider } from './context/UserContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
    return (
        <ErrorBoundary>
            <UserProvider>
                <AppRoutes />
            </UserProvider>
        </ErrorBoundary>
    );
}
