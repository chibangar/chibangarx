import { ReactNode, useCallback } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import { useModal } from '../context/ModalContext';
import { useSettings } from '../context/SettingsContext';

interface DeleteConfirmationOptions {
  title?: string;
  description: ReactNode;
  confirmText?: string;
  onConfirm: () => void;
}

export function useDeleteConfirmation() {
  const { openModal, closeModal } = useModal();
  const settings = useSettings();

  return useCallback(
    ({ title = 'Delete this item?', description, confirmText = 'Delete', onConfirm }: DeleteConfirmationOptions) => {
      if (!settings.confirmBeforeDeleting) {
        onConfirm();
        return;
      }
      openModal(
        <ConfirmationModal
          title={title}
          description={description}
          confirmText={confirmText}
          onConfirm={() => { onConfirm(); closeModal(); }}
          onCancel={closeModal}
        />,
      );
    },
    [closeModal, openModal, settings.confirmBeforeDeleting],
  );
}
