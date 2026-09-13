import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFolders } from '../../store/imageStockSlice';
import {
  fetchCodes,
  fetchFilters,
  generateBatch,
  downloadBatchPdf,
  setSearch,
  setProducerFilter,
  setBatchNoFilter,
  clearLastResult,
} from '../../store/qrStickerSlice';
import '../../styles/admin.css';

const SPLIT_TYPES = [
  { value: 'vertical-50-50', label: 'Vertical 50:50' },
  { value: 'horizontal-50-50', label: 'Horizontal 50:50' },
];

const slugifyForCode = (name) =>
  (name || 'PRODUCT')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'PRODUCT';

const packedLabel = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
    now.getFullYear()
  ).slice(-2)}`;
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const DownloadPdfButton = ({ batchId, productName, className = 'oh-btn-export', label = '⬇ Download PDF' }) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadBatchPdf(batchId, slugifyForCode(productName));
    } catch (err) {
      setError(err.message || 'Could not download the PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <span className="oh-download-btn-wrap">
      <button type="button" className={className} onClick={handleClick} disabled={downloading}>
        {downloading ? (
          <>
            <span className="oh-spinner" /> Preparing PDF…
          </>
        ) : (
          label
        )}
      </button>
      {error && <span className="oh-download-error">{error}</span>}
    </span>
  );
};

const StickerPreview = ({ form }) => {
  const previewCode = `${slugifyForCode(form.productName)}-00001`;
  const isHorizontal = form.splitType === 'horizontal-50-50';

  return (
    <div className="oh-sticker-preview-wrap">
      <div className="oh-sticker-preview-label">Sticker preview</div>
      <div className="oh-sticker-card">
        <div className="oh-sticker-header">
          <div className="oh-sticker-producer">{form.producer || 'PRODUCER NAME'}</div>
          <div className="oh-sticker-batchline">
            Batch {form.batchNo || '—'} · Packed {packedLabel()}
          </div>
        </div>
        <div className="oh-sticker-product">{form.productName || 'Product name'}</div>
        {form.variantSize && <div className="oh-sticker-variant">{form.variantSize}</div>}

        <div className={`oh-sticker-body ${isHorizontal ? 'horizontal' : 'vertical'}`}>
          <div className="oh-sticker-image-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#c9a464" strokeWidth="1.5" />
              <circle cx="9" cy="10" r="1.6" stroke="#c9a464" strokeWidth="1.3" />
              <path d="M5 17l4.5-4.5 3 3 2-2L19 17" stroke="#c9a464" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="oh-sticker-qr-box">
            <svg width="100%" height="100%" viewBox="0 0 24 24">
              <rect x="2" y="2" width="8" height="8" fill="#163832" />
              <rect x="14" y="2" width="8" height="8" fill="#163832" />
              <rect x="2" y="14" width="8" height="8" fill="#163832" />
              <rect x="15" y="15" width="2" height="2" fill="#163832" />
              <rect x="19" y="15" width="2" height="2" fill="#163832" />
              <rect x="15" y="19" width="2" height="2" fill="#163832" />
              <rect x="19" y="19" width="2" height="2" fill="#163832" />
              <rect x="15" y="17" width="2" height="2" fill="#163832" />
              <rect x="17" y="19" width="2" height="2" fill="#163832" />
            </svg>
          </div>
        </div>

        <div className="oh-sticker-footer">
          <span>ORIGINHASH</span>
          <span>{previewCode}</span>
        </div>
      </div>
    </div>
  );
};

const GenerateTab = () => {
  const dispatch = useDispatch();
  const { folders } = useSelector((s) => s.imageStock);
  const { generating, generateError, lastResult } = useSelector((s) => s.qrSticker);

  const [form, setForm] = useState({
    producer: '',
    productName: '',
    variantSize: '',
    batchNo: '',
    numberOfQrs: 10,
    splitType: 'vertical-50-50',
    folderId: '',
  });

  useEffect(() => {
    dispatch(fetchFolders());
  }, [dispatch]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const selectedFolder = useMemo(
    () => folders.find((f) => String(f.id) === String(form.folderId)),
    [folders, form.folderId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.folderId) return;
    const action = await dispatch(
      generateBatch({
        producer: form.producer.trim(),
        productName: form.productName.trim(),
        variantSize: form.variantSize.trim(),
        batchNo: form.batchNo.trim(),
        splitType: form.splitType,
        numberOfQrs: Number(form.numberOfQrs),
        folderId: Number(form.folderId),
      })
    );
    if (action.meta.requestStatus === 'fulfilled') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    dispatch(clearLastResult());
    setForm({
      producer: '',
      productName: '',
      variantSize: '',
      batchNo: '',
      numberOfQrs: 10,
      splitType: 'vertical-50-50',
      folderId: '',
    });
  };

  if (lastResult) {
    return (
      <div className="oh-qr-success">
        <div className="oh-qr-success-icon">✓</div>
        <h2 className="oh-admin-title">{lastResult.codes.length} stickers generated</h2>
        <p className="oh-admin-subtitle">
          {lastResult.batch.producer} · {lastResult.batch.productName} · Batch {lastResult.batch.batchNo}
        </p>
        <div className="oh-qr-success-actions">
          <DownloadPdfButton
            batchId={lastResult.batch.id}
            productName={lastResult.batch.productName}
            className="oh-btn-save"
          />
          <button type="button" className="oh-btn-cancel" onClick={handleReset}>
            Generate another batch
          </button>
        </div>
        <p className="oh-qr-success-note">
          Each sticker is sized to fit a standard business card. Scanning its QR code opens the product's
          assigned image.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="oh-admin-subtitle" style={{ marginBottom: 18 }}>
        Fill the details — the sticker preview updates live
      </p>

      {generateError && <div className="oh-error">{generateError}</div>}

      <div className="oh-qr-layout">
        <form className="oh-qr-form" onSubmit={handleSubmit}>
          <div className="oh-qr-form-grid">
            <div className="oh-field">
              <label>Producer</label>
              <input value={form.producer} onChange={(e) => update('producer', e.target.value)} required />
            </div>
            <div className="oh-field">
              <label>Product name</label>
              <input value={form.productName} onChange={(e) => update('productName', e.target.value)} required />
            </div>
            <div className="oh-field">
              <label>Variant / size</label>
              <input value={form.variantSize} onChange={(e) => update('variantSize', e.target.value)} />
            </div>
            <div className="oh-field">
              <label>Batch no</label>
              <input value={form.batchNo} onChange={(e) => update('batchNo', e.target.value)} required />
            </div>
            <div className="oh-field">
              <label>Number of QRs</label>
              <input
                type="number"
                min={1}
                max={500}
                value={form.numberOfQrs}
                onChange={(e) => update('numberOfQrs', e.target.value)}
                required
              />
            </div>
            <div className="oh-field">
              <label>Split type</label>
              <select value={form.splitType} onChange={(e) => update('splitType', e.target.value)}>
                {SPLIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="oh-field oh-field-span2">
              <label>Image folder</label>
              <select value={form.folderId} onChange={(e) => update('folderId', e.target.value)} required>
                <option value="">Select an existing folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.availableImagesCount ?? 0} available)
                  </option>
                ))}
              </select>
              <div className="oh-qr-folder-hint">
                🖼 {selectedFolder ? selectedFolder.availableImagesCount ?? 0 : 0} global images available · this
                batch will use {form.numberOfQrs || 0}
              </div>
            </div>
          </div>

          <button type="submit" className="oh-btn-generate" disabled={generating || !form.folderId}>
            {generating ? 'Generating…' : `⊞ Generate ${form.numberOfQrs || 0} stickers`}
          </button>
        </form>

        <StickerPreview form={form} />
      </div>
    </div>
  );
};

const HistoryTab = () => {
  const dispatch = useDispatch();
  const { codes, codesStatus, filters, search, producerFilter, batchNoFilter } = useSelector((s) => s.qrSticker);

  useEffect(() => {
    dispatch(fetchFilters());
  }, [dispatch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchCodes({ search, producer: producerFilter, batchNo: batchNoFilter }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [dispatch, search, producerFilter, batchNoFilter]);

  const groups = useMemo(() => {
    const byBatch = new Map();
    for (const code of codes) {
      if (!byBatch.has(code.batchId)) {
        byBatch.set(code.batchId, {
          batchId: code.batchId,
          producer: code.producer,
          productName: code.productName,
          batchNo: code.batchNo,
          variantSize: code.variantSize,
          folderName: code.folderName,
          createdAt: code.createdAt,
          items: [],
        });
      }
      byBatch.get(code.batchId).items.push(code);
    }
    return [...byBatch.values()];
  }, [codes]);

  return (
    <div>
      <div className="oh-toolbar">
        <input
          className="oh-search-input"
          placeholder="Search producer, product, batch no or code"
          value={search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
        />
        <select
          className="oh-status-select"
          value={producerFilter}
          onChange={(e) => dispatch(setProducerFilter(e.target.value))}
        >
          <option value="">All producers</option>
          {filters.producers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="oh-status-select"
          value={batchNoFilter}
          onChange={(e) => dispatch(setBatchNoFilter(e.target.value))}
        >
          <option value="">All batches</option>
          {filters.batchNos.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {codesStatus === 'loading' && groups.length === 0 && <div className="oh-empty-state">Loading…</div>}
      {codesStatus !== 'loading' && groups.length === 0 && (
        <div className="oh-empty-state">No QR stickers generated yet.</div>
      )}

      {groups.map((group) => (
        <div className="oh-qr-batch-group" key={group.batchId}>
          <div className="oh-qr-batch-header">
            <div>
              <div className="oh-user-name">
                {group.producer} · {group.productName}
              </div>
              <div className="oh-image-sub">
                Batch {group.batchNo}
                {group.variantSize ? ` · ${group.variantSize}` : ''} · {group.folderName} ·{' '}
                {group.items.length} codes · {formatDate(group.createdAt)}
              </div>
            </div>
            <DownloadPdfButton batchId={group.batchId} productName={group.productName} />
          </div>
          <div className="oh-qr-code-strip">
            {group.items.map((item) => (
              <div className="oh-qr-code-chip" key={item.id}>
                <img src={item.imageUrl} alt={item.code} loading="lazy" />
                <span>{item.code}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const QrStickers = () => {
  const [tab, setTab] = useState('generate');

  return (
    <div>
      <div className="oh-admin-header">
        <div>
          <h1 className="oh-admin-title">Generate QR stickers</h1>
        </div>
      </div>

      <div className="oh-tabs">
        <button type="button" className={`oh-tab ${tab === 'generate' ? 'active' : ''}`} onClick={() => setTab('generate')}>
          Generate
        </button>
        <button type="button" className={`oh-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Generated QRs
        </button>
      </div>

      {tab === 'generate' ? <GenerateTab /> : <HistoryTab />}
    </div>
  );
};

export default QrStickers;
