import { useEffect, useState } from 'react'; // React

const API_URL = 'http://localhost:8080'; // URL de la API backend

// Componente principal de la aplicación
export default function App() { 
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/files`)
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Cargando archivos...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Mini Drive</h1>

      {files.length === 0 && <p>No hay archivos</p>}

      <ul>
        {files.map((file) => (
          <li key={file.id}>
            <strong>{file.original_name}</strong>{' '}
            <a
              href={`${API_URL}/files/${file.id}/preview`}
              target='_blank'
              rel='noreferrer'
            >
              Preview
            </a>
            {' | '}
            <a href={`${API_URL}/files/${file.id}`}>Descargar</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
