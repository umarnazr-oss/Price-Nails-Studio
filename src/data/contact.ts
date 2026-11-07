export type SiteSettings = {
  phoneNumber: string;
  whatsappNumber: string;
  emailAddress: string;
  studioAddress: string;
  studioCity: string;
  instagramHref: string;
  facebookHref: string;
  servicePrices: Record<string, string>;
};

export const defaultSiteSettings: SiteSettings = {
  phoneNumber: '+33 7 81 73 85 58',
  whatsappNumber: '+33 7 81 73 85 58',
  emailAddress: 'Pricekaty85@gmail.com',
  studioAddress: '1 Allée du Pastel, 79200 Parthenay, France',
  studioCity: 'Parthenay',
  instagramHref: 'https://www.instagram.com/katypricenailsstudio/',
  facebookHref: 'https://www.facebook.com/share/p/19ops8VaGG/',
  servicePrices: {
    'shade-match': '',
    'classic-manicure': '',
    'nail-design': '',
    'nail-care': '',
  },
};

export function getPhoneHref(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.length >= 8 ? `tel:+${digits}` : '';
}

export function getWhatsAppHref(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.length >= 8 ? `https://wa.me/${digits}` : '';
}

export function getEmailHref(emailAddress: string) {
  return emailAddress.trim()
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddress.trim())}`
    : '';
}

export function getMapHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
