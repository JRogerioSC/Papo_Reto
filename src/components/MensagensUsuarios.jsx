import { useEffect, useState } from 'react';

function MensagensUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarUsuarios = async () => {
      try {
        const resposta = await fetch('https://api-papo-reto.onrender.com'); // Altere se necessário
        const dados = await resposta.json();
        setUsuarios(dados);
        setCarregando(false);
      } catch (erro) {
        console.error('Erro ao buscar usuários:', erro);
        setCarregando(false);
      }
    };

    buscarUsuarios();
    const intervalo = setInterval(buscarUsuarios, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div>
      <h2>Mensagens dos Usuários</h2>
      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <ul>
          {usuarios.map((user) => (
            <li key={user.id}>
              <strong>{user.name}:</strong> {user.menssage}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MensagensUsuarios
