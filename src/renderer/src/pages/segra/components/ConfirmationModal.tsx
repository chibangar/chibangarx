import { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import Button from './Button';

export interface ConfirmationModalProps {
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel,
}: ConfirmationModalProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <TriangleAlert className="text-yellow-500" size={32} />
        <h2 className="font-bold text-xl text-yellow-500">{title}</h2>
      </div>
      <div className="text-chibangarx-text-secondary mb-6 whitespace-pre-line">{description}</div>
      <div className="flex justify-end gap-3">
        <Button variant="primary" onClick={onCancel}>{cancelText}</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
      </div>
    </div>
  );
}
