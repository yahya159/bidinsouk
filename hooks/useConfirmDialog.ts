import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  opened: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  danger?: boolean;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    opened: false,
    title: '',
    message: '',
    onConfirm: () => {},
    danger: true,
  });
  const [loading, setLoading] = useState(false);

  const openDialog = useCallback(
    (config: Omit<ConfirmDialogState, 'opened'>) => {
      setState({
        ...config,
        opened: true,
      });
    },
    []
  );

  const closeDialog = useCallback(() => {
    if (!loading) {
      setState((prev) => ({ ...prev, opened: false }));
    }
  }, [loading]);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await state.onConfirm();
      closeDialog();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setLoading(false);
    }
  }, [state.onConfirm, closeDialog]);

  return {
    dialogProps: {
      opened: state.opened,
      onClose: closeDialog,
      onConfirm: handleConfirm,
      title: state.title,
      message: state.message,
      itemName: state.itemName,
      loading,
      danger: state.danger,
    },
    openDialog,
    closeDialog,
  };
}
