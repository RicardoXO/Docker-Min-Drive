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

  const formatSize = (bytes) => {
    // Formatear tamaño de archivo
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const handleDelete = async (id) => {
    const ok = window.confirm('¿Seguro que quieres borrar este archivo?');
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/files/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Delete failed');
      }

      loadFiles();
    } catch (err) {
      console.error(err);
      alert('Error borrando archivo');
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();

    const fileInput = e.target.file;
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const xhr = new XMLHttpRequest();

    setUploading(true);
    setProgress(0);

    xhr.open('POST', `${API_URL}/files`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      setProgress(0);
      fileInput.value = '';

      if (xhr.status >= 200 && xhr.status < 300) {
        loadFiles();
      } else {
        alert('Error subiendo archivo');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setProgress(0);
      alert('Error de red');
    };

    xhr.send(formData);
  };
  /* 
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
  */

  const [progress, setProgress] = useState(0);

  return (
    // Renderizar la interfaz de usuario
    <div style={{ padding: 20 }}>
      <h1>Mini Drive</h1>

      <form onSubmit={handleUpload}>
        <input type='file' name='file' />
        <button type='submit' disabled={uploading}>
          {uploading ? 'Subiendo...' : 'Subir'}
        </button>
        {uploading && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                height: 8,
                width: '100%',
                background: '#eee',
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: '#4caf50',
                  borderRadius: 4,
                  transition: 'width 0.2s',
                }}
              />
            </div>
            <div style={{ fontSize: 12 }}>{progress}%</div>
          </div>
        )}
      </form>

      <hr />

      {loading && <p>Cargando archivos...</p>}

      <ul>
        {files.map((file) => (
          // Renderizar cada archivo
          <li //Formarto del contenedor de cada archivo
            key={file.id}
            style={{
              marginBottom: 20,
              padding: 10,
              border: '1px solid #ddd',
              borderRadius: 6,
            }}
          >
            <div>
              <strong>{file.original_name}</strong>
            </div>

            <div style={{ fontSize: 12, color: '#a1e746ff' }}>
              {file.mime_type} · {formatSize(Number(file.size_bytes))}
            </div>

            {file.mime_type.startsWith('image/') && (
              <img
                src={`${API_URL}/files/${file.id}/preview`}
                alt={file.original_name}
                style={{
                  marginTop: 10,
                  maxWidth: 200,
                  display: 'block',
                  borderRadius: 4,
                }}
              />
            )}

            <div style={{ marginTop: 8 }}>
              <a
                href={`${API_URL}/files/${file.id}/preview`}
                target='_blank'
                rel='noreferrer'
              >
                Preview
              </a>
              {' | '}
              <a href={`${API_URL}/files/${file.id}`}>Descargar</a>
              {' | '}
              <button
                onClick={() => handleDelete(file.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'red',
                  cursor: 'pointer',
                }}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
