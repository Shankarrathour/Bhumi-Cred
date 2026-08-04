import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { router } from './routes/routes';

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
