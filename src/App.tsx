import { useEffect } from 'react';
import { useStore } from './store';
import { Welcome }    from './pages/Welcome';
import { Register }   from './pages/Register';
import { Login }      from './pages/Login';
import { Dashboard }  from './pages/Dashboard';
import { AddMoney }   from './pages/AddMoney';
import { SendMoney }  from './pages/SendMoney';
import { PayUpfront } from './pages/PayUpfront';
import { History }    from './pages/History';
import { Profile }    from './pages/Profile';

export default function App() {
  const page        = useStore(s => s.page);
  const loadSession = useStore(s => s.loadSession);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const pages: Record<string, JSX.Element> = {
    welcome:    <Welcome />,
    register:   <Register />,
    login:      <Login />,
    dashboard:  <Dashboard />,
    add:        <AddMoney />,
    send:       <SendMoney />,
    payupfront: <PayUpfront />,
    history:    <History />,
    profile:    <Profile />,
  };

  return pages[page] ?? <Welcome />;
}
