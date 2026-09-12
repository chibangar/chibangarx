import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
interface ModalOptions { size?: ModalSize; }
interface ModalContextType {
  openModal: (content: ReactNode, options?: ModalOptions) => void;
  closeModal: () => void;
  isModalOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (content: ReactNode, _options?: ModalOptions) => {
    setModalContent(content);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setModalContent(null), 150);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isModalOpen: isOpen }}>
      {children}
      {isOpen && modalContent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="bg-chibangarx-card rounded-2xl border border-chibangarx-border shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {modalContent}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};
