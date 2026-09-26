import { CheckIcon, MapIcon, PinIcon, UserIcon } from './ScanIcons.jsx';
import { formatDateShort, formatDateTimeShort, formatPlace } from '../utils/format';

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export const productLine = (product) => `${product.productName}${product.variantSize ? ` ${product.variantSize}` : ''}`;

// OpenStreetMap data needs attribution wherever its place names are shown.
export const hasPlaceNames = ({ scan, journey = [] }) =>
  Boolean(scan?.location?.name) || journey.some((step) => step.location?.name);

// Opens every located journey point in Google Maps, in order.
const journeyMapUrl = (points) =>
  points.length === 1
    ? `https://www.google.com/maps/search/?api=1&query=${points[0].latitude},${points[0].longitude}`
    : `https://www.google.com/maps/dir/${points.map((p) => `${p.latitude},${p.longitude}`).join('/')}`;

// The "Tracked" pill, product card and product journey timeline. `journeyScope` is 'all' for
// admins and the batch's creator, 'own' for anyone else (the server only sends their own scans).
const JourneySection = ({ product, journey, buyerVerifiedAt, journeyScope, scannedBy }) => {
  const located = journey.filter((step) => step.location).map((step) => step.location);

  return (
    <>
      <span className={`oh-details-pill ${buyerVerifiedAt ? 'success' : 'info'}`}>
        <PinIcon size={14} />
        {buyerVerifiedAt ? 'Tracked · verified by the buyer' : 'Tracked · not yet verified'}
      </span>

      {product && (
        <div className="oh-details-product">
          <div className="oh-details-product-name">{productLine(product)}</div>
          <div className="oh-details-product-code">
            {product.code} · Batch {product.batchNo}
          </div>
          <div className="oh-details-product-label">Producer</div>
          <div className="oh-details-product-producer">{product.producer}</div>
          {product.packedAt && <div className="oh-details-product-meta">Packed {formatDateShort(product.packedAt)}</div>}
          {scannedBy && !scannedBy.isYou && (
            <div className="oh-details-product-meta">
              Scanned by {scannedBy.name || 'an unnamed user'}
              {scannedBy.userType ? ` (${capitalize(scannedBy.userType)})` : ''}
            </div>
          )}
        </div>
      )}

      <h2 className="oh-journey-title">
        Product journey · {journey.length} {journey.length === 1 ? 'scan' : 'scans'}
      </h2>
      {journeyScope === 'own' && (
        <p className="oh-journey-scope">
          Only your scans are shown. The batch's creator and OriginHash admins can see the full journey.
        </p>
      )}
      <ol className="oh-journey">
        {journey.map((step, i) => (
          <li key={step.id} className="oh-journey-step">
            <span className="oh-journey-dot">{i + 1}</span>
            <div className="oh-journey-card">
              <div className="oh-journey-head">
                <strong>
                  Scan {i + 1}
                  {step.userType ? ` · ${capitalize(step.userType)}` : ''}
                </strong>
                <span>{formatDateTimeShort(step.createdAt)}</span>
              </div>
              <div className="oh-journey-line">
                <UserIcon size={14} />
                {step.userName || 'Unnamed user'}
                {step.isYou && <em> (you)</em>}
              </div>
              <div className="oh-journey-line">
                <PinIcon size={14} />
                {step.location ? formatPlace(step.location) : 'Location not shared'}
              </div>
            </div>
          </li>
        ))}
        <li className={`oh-journey-step end ${buyerVerifiedAt ? 'done' : ''}`}>
          <span className="oh-journey-dot">{buyerVerifiedAt && <CheckIcon size={12} />}</span>
          <div className="oh-journey-end">
            {buyerVerifiedAt
              ? `Verified by the final buyer · ${formatDateTimeShort(buyerVerifiedAt)}`
              : 'Awaiting verification by the final buyer'}
          </div>
        </li>
      </ol>

      {located.length > 0 && (
        <a className="oh-journey-map" href={journeyMapUrl(located)} target="_blank" rel="noopener noreferrer">
          <MapIcon size={18} />
          View journey on map
        </a>
      )}
    </>
  );
};

export default JourneySection;
