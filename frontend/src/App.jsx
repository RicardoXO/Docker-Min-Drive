import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8080';

export default function App() {
  const [files, setFiles] = useState([]); // Lista de archivos
  const [loading, setLoading] = useState(false); // Estado de carga
  const [uploading, setUploading] = useState(false); // Estado de subida

  const loadFiles = () => {
    // Cargar archivos desde el backend
    setLoading(true);
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
  };

  useEffect(() => {
    // Cargar archivos al montar el componente
    loadFiles();
  }, []);

  const handleUpload = async (e) => {
    // Manejar subida de archivos
    e.preventDefault();

    const fileInput = e.target.file; // Input de archivo
    if (!fileInput.files.length) return; // Si no hay archivo, salir

    const formData = new FormData(); // Crear FormData para la subida
    formData.append('file', fileInput.files[0]); // Añadir archivo al FormData

    setUploading(true); // Indicar que se está subiendo

    try {
      // Intentar subir el archivo
      const res = await fetch(`${API_URL}/files`, {
        // Petición al endpoint de subida
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        // Si la respuesta no es OK, lanzar error
        throw new Error('Upload failed');
      }

      await res.json(); // Esperar la respuesta JSON
      fileInput.value = '';
      loadFiles();
    } catch (err) {
      // Manejar errores
      console.error(err);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    // Renderizar la interfaz de usuario
    <div style={{ padding: 20 }}>
      <h1>Mini Drive</h1>

      <form onSubmit={handleUpload}>
        <input type='file' name='file' />
        <button type='submit' disabled={uploading}>
          {uploading ? 'Subiendo...' : 'Subir'}
        </button>
      </form>

      <hr />

      {loading && <p>Cargando archivos...</p>}

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
