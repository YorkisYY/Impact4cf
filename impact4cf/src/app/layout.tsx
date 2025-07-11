import type { Metadata } from 'next';

import './../scss/style.scss';

// project imports
import ProviderWrapper from 'store/ProviderWrapper';

export const metadata: Metadata = {
  title: 'ImpACT4CF',
  description:
    'Start your next React project with Berry admin template. It build with Reactjs, Material-UI, Redux, and Hook for faster web development.'
};

// ==============================|| ROOT LAYOUT ||============================== //

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}
