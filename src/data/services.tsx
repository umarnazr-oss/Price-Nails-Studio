export type StoreService = { id: string; titleKey: string; descriptionKey: string; icon: 'shade' | 'manicure' | 'design' | 'care'; noteKey: string };
export const services: StoreService[] = [
  { id: 'shade-match', titleKey: 'serviceShade', descriptionKey: 'serviceShadeDesc', icon: 'shade', noteKey: 'serviceOnline' },
  { id: 'classic-manicure', titleKey: 'serviceManicure', descriptionKey: 'serviceManicureDesc', icon: 'manicure', noteKey: 'serviceBooking' },
  { id: 'nail-design', titleKey: 'serviceDesign', descriptionKey: 'serviceDesignDesc', icon: 'design', noteKey: 'serviceCustom' },
  { id: 'nail-care', titleKey: 'serviceCare', descriptionKey: 'serviceCareDesc', icon: 'care', noteKey: 'serviceOnline' },
];
