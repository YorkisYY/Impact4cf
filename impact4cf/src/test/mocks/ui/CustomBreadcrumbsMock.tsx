// import React from 'react';

export interface CustomBreadcrumbsProps {
  links?: Array<{ title: string; to?: string }>;
  sx?: any;
  titleBottom?: boolean;
  card?: boolean;
  custom?: boolean;
}

export const mockCustomBreadcrumbs = () => {
  jest.mock('@/ui-component/extended/CustomBreadcrumbs', () => {
    return {
      __esModule: true,
      default: jest.fn().mockImplementation((props: CustomBreadcrumbsProps) => (
        <div data-testid="mock-breadcrumbs">
          {props.links && props.links.map((link, index) => (
            <span key={index} data-testid={`breadcrumb-link-${index}`}>
              {link.title}
            </span>
          ))}
        </div>
      ))
    };
  });
};