export const mockConfigContext = () => {
    jest.mock('contexts/ConfigContext', () => ({
      ConfigContext: {
        Provider: ({ children }: { children: React.ReactNode }) => children,
        Consumer: ({ children }: { children: (props: any) => React.ReactNode }) => children({}),
      }
    }), { virtual: true });
  };

  export const mockConfig = () => {
    jest.mock('config', () => ({
      ThemeMode: {
        LIGHT: 'light',
        DARK: 'dark'
      },
      ThemeDirection: {
        LTR: 'ltr',
        RTL: 'rtl'
      },
      MenuOrientation: {
        VERTICAL: 'vertical',
        HORIZONTAL: 'horizontal'
      },
      default: {
        fontFamily: 'Roboto, sans-serif',
        borderRadius: 8,
        outlinedFilled: true,
        mode: 'light',
        presetColor: 'default',
        i18n: 'en',
        themeDirection: 'ltr',
        container: true
      }
    }), { virtual: true });
  };

  export const mockUseConfig = () => {
    jest.mock('../../hooks/useConfig', () => ({
      __esModule: true,
      default: () => ({
        onChangeMenuType: jest.fn(),
        menuOrientation: 'vertical',
        onChangeMode: jest.fn(),
        mode: 'light',
        themeDirection: 'ltr' 
      })
    }), { virtual: true });
  };

  export const mockNextFont = () => {
    jest.mock('next/font/google', () => ({
      Roboto: () => ({
        className: 'mock-roboto-className',
        style: { fontFamily: 'Roboto, sans-serif' }
      })
    }));
  };

  export const mockNextNavigation = () => {
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
      }),
      usePathname: () => '/mock-path', 
    }));
  };

  export const mockMenuItems = () => {
    jest.mock('../../menu-items', () => ({
      items: [
        // Your mock items...
      ]
    }), { virtual: true });
  };