import React from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';
import './ConfirmModal.css';

/**
 * ConfirmModal — A premium-styled confirmation dialog.
 *
 * Props:
 *  - isOpen      {boolean}   Whether the modal is visible
 *  - onConfirm   {function}  Called when the user confirms
 *  - onCancel    {function}  Called when the user cancels
 *  - title       {string}    Modal title (default: "Confirmer la suppression")
 *  - message     {string|ReactNode}  Body message / description
 *  - confirmText {string}    Text for the confirm button (default: "Supprimer")
 *  - cancelText  {string}    Text for the cancel button (default: "Annuler")
 *  - variant     {"danger"|"warning"|"info"}  Visual style (default: "danger")
 */
const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirmer la suppression',
  message = 'Cette action est irréversible.',
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const IconComponent = variant === 'danger' ? Trash2 : variant === 'warning' ? AlertTriangle : Info;

  // Close when clicking the overlay background
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="confirm-overlay" onClick={handleOverlayClick}>
      <div className="confirm-card">
        {/* Icon */}
        <div className={`confirm-icon-wrapper ${variant}`}>
          <IconComponent size={28} />
        </div>

        {/* Title */}
        <h3 className="confirm-title">{title}</h3>

        {/* Message */}
        <p className="confirm-message">{message}</p>

        {/* Divider */}
        <div className="confirm-divider" />

        {/* Buttons */}
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>
            <X size={16} />
            {cancelText}
          </button>
          <button className={`confirm-btn confirm-btn-${variant}`} onClick={onConfirm}>
            <IconComponent size={16} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
