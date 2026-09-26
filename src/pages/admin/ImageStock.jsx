import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFolders,
  createFolder,
  generateSampleFolder,
  deleteFolder,
  fetchImages,
  uploadImages,
  toggleImageBlock,
  clearRejected,
} from '../../store/imageStockSlice';
import '../../styles/admin.css';

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const NewFolderCard = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    const ok = await onCreate(name.trim());
    setSaving(false);
    if (ok) {
      setName('');
      setOpen(false);
    } else {
      setError('Could not create folder.');
    }
  };

  if (!open) {
    return (
      <button type="button" className="oh-folder-card oh-folder-card-new" onClick={() => setOpen(true)}>
        <span className="oh-folder-new-icon">+</span>
        New folder
      </button>
    );
  }

  return (
    <form className="oh-folder-card oh-folder-card-new oh-folder-card-form" onSubmit={handleCreate}>
      <input
        autoFocus
        placeholder="Folder name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />
      {error && <span className="oh-folder-error">{error}</span>}
      <div className="oh-folder-form-actions">
        <button type="button" className="oh-btn-cancel" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className="oh-btn-save" disabled={saving}>
          {saving ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  );
};

// `onDelete` is only passed for sample folders an admin can remove.
const FolderCard = ({ folder, onOpen, onDelete }) => (
  <div className="oh-folder-card-wrap">
    <button type="button" className="oh-folder-card" onClick={() => onOpen(folder)}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.4l1.6 2h9A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
          stroke="var(--oh-forest)"
          strokeWidth="1.5"
        />
      </svg>
      <span className="oh-folder-name">{folder.name}</span>
      <span className="oh-folder-count">{folder.imagesCount ?? 0} images</span>
      {folder.isSample && <span className="oh-badge sample">Sample</span>}
    </button>
    {onDelete && (
      <button
        type="button"
        className="oh-folder-delete"
        onClick={() => onDelete(folder)}
        title="Delete this sample folder"
        aria-label={`Delete ${folder.name}`}
      >
        ✕
      </button>
    )}
  </div>
);

const ImageCard = ({ image, showFolder, onToggleBlock, onView, canModerate }) => {
  const [toggling, setToggling] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleToggleBlock = async () => {
    setToggling(true);
    await onToggleBlock(image.id, !image.isBlocked);
    setToggling(false);
  };

  return (
    <div className="oh-image-card">
      <button type="button" className="oh-image-thumb oh-image-thumb-btn" onClick={() => onView(image)} title="View image">
        {!imgLoaded && (
          <div className="oh-image-thumb-loading">
            <span className="oh-thumb-spinner" />
          </div>
        )}
        <img
          src={image.url}
          alt={image.fileName}
          loading="lazy"
          className={imgLoaded ? 'loaded' : ''}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />
        <span className={`oh-badge oh-image-status ${image.isBlocked ? 'blocked' : 'available'}`}>
          {image.isBlocked ? 'Blocked' : 'Available'}
        </span>
        <span className="oh-image-view-icon">👁</span>
      </button>
      <div className="oh-image-meta">
        <div className="oh-image-name" title={image.fileName}>
          {image.fileName}
        </div>
        <div className="oh-image-sub">
          {image.serialNo != null && `No. ${image.serialNo} · `}
          {image.width}×{image.height}
          {showFolder && image.folderName ? ` · ${image.folderName}` : ''}
        </div>
        <div className="oh-image-sub">
          {formatDate(image.createdAt)} · {formatBytes(image.sizeBytes)}
        </div>
      </div>
      {canModerate && (
        <div className="oh-image-actions-row">
          <button
            type="button"
            className={image.isBlocked ? 'oh-btn-unblock' : 'oh-btn-block'}
            onClick={handleToggleBlock}
            disabled={toggling}
          >
            {toggling ? '…' : image.isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      )}
    </div>
  );
};

const ImageViewModal = ({ image, onClose }) => {
  if (!image) return null;
  return (
    <div className="oh-panel-backdrop oh-lightbox-backdrop" onClick={onClose}>
      <div className="oh-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="oh-panel-close oh-lightbox-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <img src={image.url} alt={image.fileName} />
        <div className="oh-lightbox-meta">
          <div className="oh-image-name">{image.fileName}</div>
          <div className="oh-image-sub">
            {image.width}×{image.height} · {formatBytes(image.sizeBytes)}
            {image.folderName ? ` · ${image.folderName}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadDropzone = ({ folderId, onUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notices, setNotices] = useState([]);
  const filesInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const dispatch = useDispatch();

  const doUpload = async (fileList) => {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    setNotices([]);
    const action = await dispatch(uploadImages({ folderId, files: fileList }));
    setUploading(false);
    if (action.meta.requestStatus === 'fulfilled') {
      if (action.payload.rejected?.length) {
        setNotices(action.payload.rejected.map((r) => `${r.fileName}: ${r.reason}`));
      }
      onUploaded?.();
      dispatch(clearRejected());
    } else {
      setNotices([action.payload || 'Upload failed.']);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    doUpload(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`oh-dropzone ${dragActive ? 'active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="oh-dropzone-icon">⬆</div>
        <div className="oh-dropzone-title">{uploading ? 'Uploading…' : 'Drag and drop images here'}</div>
        <div className="oh-dropzone-subtitle">
          JPG or PNG · at least 640×480 (either way round) and in sharp focus · duplicates are auto-rejected
        </div>
        <div className="oh-dropzone-actions">
          <button type="button" className="oh-btn-save" onClick={() => filesInputRef.current?.click()} disabled={uploading}>
            Choose files
          </button>
          <button type="button" className="oh-btn-cancel" onClick={() => folderInputRef.current?.click()} disabled={uploading}>
            Choose folder
          </button>
        </div>
        <input
          ref={filesInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          hidden
          onChange={(e) => doUpload(e.target.files)}
        />
        <input
          ref={folderInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          webkitdirectory=""
          directory=""
          hidden
          onChange={(e) => doUpload(e.target.files)}
        />
      </div>
      {notices.length > 0 && (
        <div className="oh-dropzone-notices">
          {notices.map((n, i) => (
            <div key={i}>{n}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const FolderDetail = ({ folder, onBack, onDelete }) => {
  const dispatch = useDispatch();
  const { images, imagesStatus } = useSelector((s) => s.imageStock);
  const canModerate = useSelector((s) => Boolean(s.auth.user?.isAdmin));
  const [search, setSearch] = useState('');
  const [viewingImage, setViewingImage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    const result = await onDelete(folder);
    if (result.ok) {
      onBack();
    } else {
      setDeleting(false);
      if (result.message) setDeleteError(result.message);
    }
  };

  useEffect(() => {
    dispatch(fetchImages({ folderId: folder.id }));
  }, [dispatch, folder.id]);

  const filtered = useMemo(
    () => images.filter((img) => img.fileName.toLowerCase().includes(search.toLowerCase())),
    [images, search]
  );

  return (
    <div>
      <div className="oh-admin-header">
        <div>
          <button type="button" className="oh-back-link" onClick={onBack}>
            ← All folders
          </button>
          <h1 className="oh-admin-title">
            {folder.name} {folder.isSample && <span className="oh-badge sample">Sample</span>}
          </h1>
          <p className="oh-admin-subtitle">{filtered.length} images</p>
        </div>
        {canModerate && folder.isSample && (
          <div className="oh-header-actions">
            <button type="button" className="oh-btn-block" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete sample folder'}
            </button>
          </div>
        )}
      </div>

      {deleteError && <div className="oh-error">{deleteError}</div>}

      <UploadDropzone folderId={folder.id} onUploaded={() => dispatch(fetchImages({ folderId: folder.id }))} />

      <div className="oh-toolbar" style={{ marginTop: 18 }}>
        <input
          className="oh-search-input"
          placeholder="Search filename"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {imagesStatus === 'loading' && images.length === 0 && <div className="oh-empty-state">Loading images…</div>}
      {imagesStatus !== 'loading' && filtered.length === 0 && (
        <div className="oh-empty-state">No images in this folder yet.</div>
      )}

      <div className="oh-image-grid">
        {filtered.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onToggleBlock={(id, block) => dispatch(toggleImageBlock({ id, block }))}
            onView={setViewingImage}
            canModerate={canModerate}
          />
        ))}
      </div>

      <ImageViewModal image={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
};

const ImageStock = () => {
  const dispatch = useDispatch();
  const { folders, foldersStatus, images, imagesStatus } = useSelector((s) => s.imageStock);
  const canModerate = useSelector((s) => Boolean(s.auth.user?.isAdmin));
  const [tab, setTab] = useState('folders');
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', text, folder? }

  useEffect(() => {
    dispatch(fetchFolders());
  }, [dispatch]);

  useEffect(() => {
    if (tab === 'pictures' && !selectedFolder) {
      dispatch(fetchImages());
    }
  }, [dispatch, tab, selectedFolder]);

  const handleCreateFolder = async (name) => {
    const action = await dispatch(createFolder(name));
    return action.meta.requestStatus === 'fulfilled';
  };

  const handleGenerateSample = async () => {
    setGenerating(true);
    setNotice(null);
    const action = await dispatch(generateSampleFolder());
    setGenerating(false);
    if (action.meta.requestStatus !== 'fulfilled') {
      setNotice({ type: 'error', text: action.payload });
      return;
    }
    const { folder, images: added, skipped = [] } = action.payload;
    const categories = added.map((img) => img.fileName.replace(/\.\w+$/, '')).join(', ');
    const missing = skipped.length ? ` Couldn't add: ${skipped.map((s) => s.category).join(', ')}.` : '';
    setNotice({ type: 'success', text: `${folder.name} created with ${added.length} images: ${categories}.${missing}`, folder });
  };

  // Resolves to { ok, message }; a cancelled confirm is { ok: false } with no message.
  const handleDeleteFolder = async (folder) => {
    const count = folder.imagesCount ?? 0;
    const question =
      `Delete ${folder.name} and its ${count} image${count === 1 ? '' : 's'}? ` +
      "QR stickers already generated from it keep working. This can't be undone.";
    if (!window.confirm(question)) {
      return { ok: false };
    }
    const action = await dispatch(deleteFolder(folder.id));
    if (action.meta.requestStatus === 'fulfilled') {
      setNotice({ type: 'success', text: action.payload.message || `${folder.name} deleted.` });
      return { ok: true };
    }
    setNotice({ type: 'error', text: action.payload });
    return { ok: false, message: action.payload };
  };

  const filteredFolders = useMemo(
    () => folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [folders, search]
  );

  const filteredImages = useMemo(
    () => images.filter((img) => img.fileName.toLowerCase().includes(search.toLowerCase())),
    [images, search]
  );

  if (selectedFolder) {
    return (
      <FolderDetail folder={selectedFolder} onBack={() => setSelectedFolder(null)} onDelete={handleDeleteFolder} />
    );
  }

  return (
    <div>
      <div className="oh-admin-header">
        <div>
          <h1 className="oh-admin-title">Image stock</h1>
          <p className="oh-admin-subtitle">
            {folders.length} folders · {images.length} images
          </p>
        </div>
        {canModerate && (
          <div className="oh-header-actions">
            <button type="button" className="oh-btn-add oh-btn-with-spinner" onClick={handleGenerateSample} disabled={generating}>
              {generating ? (
                <>
                  <span className="oh-spinner" /> Fetching 10 photos…
                </>
              ) : (
                '+ Generate sample folder'
              )}
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div className={notice.type === 'error' ? 'oh-error' : 'oh-success'}>
          {notice.text}
          {notice.folder && (
            <button type="button" className="oh-link-btn oh-notice-action" onClick={() => setSelectedFolder(notice.folder)}>
              Open folder
            </button>
          )}
        </div>
      )}

      <div className="oh-toolbar">
        <input
          className="oh-search-input"
          placeholder="Search filename or folder"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="oh-tabs">
        <button type="button" className={`oh-tab ${tab === 'folders' ? 'active' : ''}`} onClick={() => setTab('folders')}>
          Folders
        </button>
        <button type="button" className={`oh-tab ${tab === 'pictures' ? 'active' : ''}`} onClick={() => setTab('pictures')}>
          Pictures
        </button>
      </div>

      {tab === 'folders' && (
        <>
          {foldersStatus === 'loading' && folders.length === 0 && <div className="oh-empty-state">Loading folders…</div>}
          <div className="oh-folder-grid">
            <NewFolderCard onCreate={handleCreateFolder} />
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={setSelectedFolder}
                onDelete={canModerate && folder.isSample ? handleDeleteFolder : undefined}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'pictures' && (
        <>
          {imagesStatus === 'loading' && images.length === 0 && <div className="oh-empty-state">Loading images…</div>}
          {imagesStatus !== 'loading' && filteredImages.length === 0 && (
            <div className="oh-empty-state">No images uploaded yet.</div>
          )}
          <div className="oh-image-grid">
            {filteredImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                showFolder
                onToggleBlock={(id, block) => dispatch(toggleImageBlock({ id, block }))}
                onView={setViewingImage}
                canModerate={canModerate}
              />
            ))}
          </div>
        </>
      )}

      <ImageViewModal image={viewingImage} onClose={() => setViewingImage(null)} />
    </div>
  );
};

export default ImageStock;
