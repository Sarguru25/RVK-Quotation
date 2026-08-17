import CustomerSplitLayout from './CustomerSplitLayout';

export default function CustomersLayout({ children }) {
  // We can't access search parameters easily in a Server Component layout, 
  // but we can pass children to the Client Component layout wrapper.
  return (
    <CustomerSplitLayout>
      {children}
    </CustomerSplitLayout>
  );
}
