import toast from 'react-hot-toast';

export const showToast = (message, type = 'success') => {
  switch (type) {
    case 'success':
      return toast.success(message);
    case 'error':
      return toast.error(message);
    case 'loading':
      return toast.loading(message);
    case 'info':
      return toast(message, { icon: 'ℹ️' });
    case 'warning':
      return toast(message, { icon: '⚠️' });
    default:
      return toast(message);
  }
};

// Add method-style calls for convenience
showToast.success = (message) => showToast(message, 'success');
showToast.error = (message) => showToast(message, 'error');
showToast.info = (message) => showToast(message, 'info');
showToast.warning = (message) => showToast(message, 'warning');
showToast.loading = (message) => showToast(message, 'loading');