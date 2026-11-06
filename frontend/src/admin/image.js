/**
 * Prépare une photo avant envoi : redimensionnée dans le navigateur (2000 px max, JPEG) pour
 * des envois rapides même sur une connexion lente. Les PNG restent en PNG (logos, transparence).
 */
const MAX_SIZE = 2000;
const MAX_BYTES = 4 * 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Ce fichier ne peut pas être lu comme une image.'));
    };
    img.src = url;
  });
}

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(blob);
  });

export async function prepareImage(file) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error('Format non accepté : choisissez une photo JPEG, PNG ou WebP.');
  }
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
  if (!blob) throw new Error('Conversion de l’image impossible.');
  if (blob.size > MAX_BYTES) throw new Error('Image trop lourde même après réduction (4 Mo maximum).');
  return { contentType: type, data: await toBase64(blob) };
}
