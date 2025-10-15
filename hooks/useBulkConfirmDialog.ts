import { useState, useCallback } from 'react';

interface BulkConfirmDialogState {
  opened: boolean;
  title: string;
  message: string;
  itemCount: number;
  actionType: 'delete' | 'update' | 'archive' | 'activate' | 'suspend';
  onConfirm: () => void | Promise<void>;
  warnings?: string[];
}

export function useBulkConfirmDialog() {
  const [state, setState] = useState<BulkConfirmDialogState>({
    opened: false,
    title: '',
    message: '',
    itemCount: 0,
    actionType: 'update',
    onConfirm: () => {},
    warnings: [],
  });
  const [loading, setLoading] = useState(false);

  const openDialog = useCallback(
    (config: Omit<BulkConfirmDialogState, 'opened'>) => {
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
      console.error('Bulk action failed:', error);
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
      itemCount: state.itemCount,
      actionType: state.actionType,
      loading,
      warnings: state.warnings,
    },
    openDialog,
    closeDialog,
  };
}
