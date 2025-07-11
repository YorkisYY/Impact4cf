import { mockCustomBreadcrumbs } from './ui/CustomBreadcrumbsMock';
import { mockConfigContext, mockConfig, mockUseConfig, mockNextFont, mockNextNavigation, mockMenuItems } from './others/otherMocks';

// This function sets up all common mocks
export const setupAllMocks = () => {
  // Correct order is important for dependencies
  mockConfigContext();
  mockConfig();
  mockMenuItems();
  mockUseConfig();
  mockNextFont();
  mockNextNavigation();
  mockCustomBreadcrumbs();
};

// Export individual mocks for more granular control
export {
  mockCustomBreadcrumbs,
  mockConfigContext,
  mockConfig,
  mockUseConfig,
  mockNextFont,
  mockNextNavigation,
  mockMenuItems
};