'use client';

import React, { ReactNode, Ref } from 'react';

// material-ui
import { SxProps } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// import Typography from '@mui/material/Typography';

// project imports
import { ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';

interface CompactSubCardProps {
  children: ReactNode | string | null;
  className?: string;
  sx?: SxProps;
  contentSX?: SxProps;
}

// ==============================|| COMPACT SUB CARD ||============================== //

const CompactSubCard = React.forwardRef(
  (
    {
      children,
      className,
      sx = {},
      contentSX = {},
      ...others
    }: CompactSubCardProps,
    ref: Ref<HTMLDivElement>
  ) => {
    const { mode } = useConfig();
    const defaultShadow = mode === ThemeMode.DARK ? '0 1px 7px 0 rgb(33 150 243 / 10%)' : '0 1px 7px 0 rgb(32 40 45 / 8%)';

    return (
      <Card 
        ref={ref} 
        sx={{ 
          border: '1px solid', 
          borderColor: 'divider', 
          ':hover': { boxShadow: defaultShadow }, 
          m: 0, // no margin
          ...sx 
        }} 
        {...others}
      >
        {/* compact card content */}
        <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5, pt: 0.5 }, ...contentSX }} className={className || ''}>
          {children}
        </CardContent>
      </Card>
    );
  }
);

export default CompactSubCard;