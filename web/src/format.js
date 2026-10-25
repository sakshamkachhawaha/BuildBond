export const formatPaise = (paise) => `₹${(paise / 100).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
})}`;
export const formatDate = (value) => new Date(value).toLocaleString('en-IN');

