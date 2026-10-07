// The sticker behind a scan: its QR (everyone who can open the scan) and, for admins and the
// batch's creator, the image printed beside it. The server leaves `imageUrl` out for anyone else.
// Both tiles are the same square, like on the printed sticker; tapping one opens it full size.
const StickerMedia = ({ sticker }) => {
  if (!sticker?.qrDataUrl) return null;
  const { code, qrDataUrl, imageUrl } = sticker;

  return (
    <div className={`oh-sticker-media ${imageUrl ? 'pair' : ''}`}>
      <figure className="oh-sticker-tile">
        <a href={qrDataUrl} download={`${code}-qr.png`} title="Download QR code">
          <img src={qrDataUrl} alt={`QR code for ${code}`} />
        </a>
        <figcaption>
          QR code
          <span className="oh-sticker-code">{code}</span>
        </figcaption>
      </figure>
      {imageUrl && (
        <figure className="oh-sticker-tile photo">
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" title="Open full size">
            <img src={imageUrl} alt={`Image printed on sticker ${code}`} loading="lazy" />
          </a>
          <figcaption>Sticker image</figcaption>
        </figure>
      )}
    </div>
  );
};

export default StickerMedia;
