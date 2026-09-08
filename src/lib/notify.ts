import { toast, ToastOptions } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

export const notify = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      className: "zips-toast zips-toast-success",
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...defaultOptions,
      ...options,
      autoClose: 5000,
      className: "zips-toast zips-toast-error",
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      ...defaultOptions,
      ...options,
      className: "zips-toast zips-toast-info",
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      ...defaultOptions,
      ...options,
      className: "zips-toast zips-toast-warning",
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      messages,
      {
        ...defaultOptions,
        ...options,
      }
    );
  },

  dismiss: (id?: string | number) => {
    toast.dismiss(id);
  },
};
