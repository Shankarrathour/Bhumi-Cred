export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    if (url.startsWith('http')) {
      image.setAttribute('crossOrigin', 'anonymous')
    }
    image.src = url
  })

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Calculate target dimensions
  // To avoid huge images, we cap the width at 1800px (user requested 1800-1920 max)
  let targetWidth = pixelCrop.width
  let targetHeight = pixelCrop.height

  const MAX_WIDTH = 1800
  if (targetWidth > MAX_WIDTH) {
    const ratio = MAX_WIDTH / targetWidth
    targetWidth = MAX_WIDTH
    targetHeight = Math.round(targetHeight * ratio)
  }

  // set canvas size to match the bounding box
  canvas.width = targetWidth
  canvas.height = targetHeight

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(targetWidth / 2, targetHeight / 2)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-targetWidth / 2, -targetHeight / 2)

  // draw cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  )

  // As a blob, compress to 85% webp
  return new Promise((resolve) => {
    canvas.toBlob(
      (file) => {
        resolve(file)
      },
      'image/webp',
      0.85
    )
  })
}
