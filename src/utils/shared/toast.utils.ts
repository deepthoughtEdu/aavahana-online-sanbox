import toast from "react-hot-toast";

export const notify = {
  success: (msg: string) => toast.success(msg, { duration: 3000 }),
  error:   (msg: string) => toast.error(msg,   { duration: 4000 }),
  warning: (msg: string) => toast(msg,          { duration: 3500, icon: "⚠️" }),
  info:    (msg: string) => toast(msg,          { duration: 3000, icon: "ℹ️" }),
  loading: (msg: string) => toast.loading(msg),
  dismiss: (id?: string) => toast.dismiss(id),
};

export { toast };
