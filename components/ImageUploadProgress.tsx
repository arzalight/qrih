export type ImageUploadState = 'pending' | 'uploading' | 'completed' | 'error'
export function ImageUploadProgress({ states }: { states: ImageUploadState[] }) {
  if (!states.length) return null
  const labels = { pending: 'Pendiente', uploading: 'Subiendo…', completed: 'Completada', error: 'Error. Conserva la foto y vuelve a intentar.' }
  return <section className="image-upload-progress" aria-label="Carga de fotografías" aria-live="polite" aria-busy={states.includes('uploading')}>
    <ul>{states.map((state, index) => <li key={index}>Foto {index + 1}: {labels[state]}</li>)}</ul>
    {states.includes('uploading') && <progress aria-label="Subiendo fotografías" />}
  </section>
}
