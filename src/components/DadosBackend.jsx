import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function DadosBackend() {
  const [dados, setDados] = useState([]);
  const dadosRef = useRef([]);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await axios.get('https://api-papo-reto.onrender.com');
        const novosDados = res.data;

        // Verifica se os dados mudaram comparado ao último fetch
        const mudaram = JSON.stringify(novosDados) !== JSON.stringify(dadosRef.current);

        if (mudaram) {
          setDados(novosDados);
          dadosRef.current = novosDados;
        }
      } catch (error) {
        console.error('Erro ao buscar dados do backend:', error);
      }
    };

    buscarDados(); // Primeiro fetch imediato

    const intervalo = setInterval(buscarDados, 1000); // Atualiza a cada 1 segundo

    return () => clearInterval(intervalo); // Limpa ao desmontar
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Dados do Backend (atualizando a cada 1s)</h2>
      <ul>
        {dados.map((item) => (
          <li key={item.id}>
            <strong>{item.nome}</strong>: {item.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DadosBackend;