import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
    });
  },
  warning: (message: string) => {
    toast(message, {
      icon: '⚠️',
      duration: 4000,
      style: {
        background: '#fbbf24',
        color: '#fff',
      },
    });
  },
  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
      duration: 4000,
    });
  },
  loading: (message: string) => {
    return toast.loading(message);
  },
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
};

