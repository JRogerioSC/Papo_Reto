import { useEffect } from 'react';
import Home from '../pages/Home';

function App() {
  useEffect(() => {
    const intervalo = setInterval(() => {
      window.location.reload();
    }, 3000); // 3 segundos

    return () => clearInterval(intervalo); // limpa se o componente for desmontado
  }, []);

  return (
    <div>
      <h1>Minha Página</h1>
      <p>Essa página recarrega a cada 3 segundos.</p>
    </div>
  );
}

export default App;

