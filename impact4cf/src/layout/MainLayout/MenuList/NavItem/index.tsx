'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useEffect, useRef, useState } from 'react';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { handlerActiveItem, handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { MenuOrientation, ThemeDirection, ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';

// third party
import { FormattedMessage } from 'react-intl';

// assets
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// types
import { LinkTarget, NavItemType } from 'types';

// ==============================|| SIDEBAR MENU LIST ITEMS ||============================== //

interface NavItemProps {
  item: NavItemType;
  level: number;
  isParents?: boolean;
  setSelectedID?: () => void;
}

export default function NavItem({ item, level, isParents = false, setSelectedID }: NavItemProps) {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const ref = useRef<HTMLSpanElement>(null);

  const pathname = usePathname();
  const { mode, menuOrientation, borderRadius, themeDirection } = useConfig();

  const { menuMaster } = useGetMenuMaster();
  const openItem = menuMaster.openedItem;
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downMD;
  const isSelected = openItem === item.id;

  const [hoverStatus, setHover] = useState<boolean>(false);

  const compareSize = () => {
    const compare = ref.current && ref.current.scrollWidth > ref.current.clientWidth;
    setHover(compare as boolean);
  };

  useEffect(() => {
    compareSize();
    window.addEventListener('resize', compareSize);

    return () => window.removeEventListener('resize', compareSize);
  }, []);

  const Icon = item?.icon;
  const itemIcon = item?.icon ? (
    <Icon stroke={1.5} size={drawerOpen ? '20px' : '24px'} style={{ ...(isHorizontal && isParents && { fontSize: 20, stroke: '1.5' }) }} />
  ) : (
    <FiberManualRecordIcon sx={{ width: isSelected ? 8 : 6, height: isSelected ? 8 : 6 }} fontSize={level > 0 ? 'inherit' : 'medium'} />
  );

  let itemTarget: LinkTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  const itemHandler = () => {
    if (downMD) handlerDrawerOpen(false);

    if (isParents && setSelectedID) {
      setSelectedID();
    }
  };

  // active menu item on page load
  useEffect(() => {
    if (pathname === item.url) handlerActiveItem(item.id!);
    // eslint-disable-next-line
  }, [pathname]);

  const iconSelectedColor = 'common.white';

  return (
    <>
      {!isHorizontal ? (
        <ListItemButton
          component={Link}
          href={item.url!}
          target={itemTarget}
          disabled={item.disabled}
          disableRipple={!drawerOpen}
          sx={{
            zIndex: 1201,
            borderRadius: `${borderRadius}px`,
            mb: 0.5,
            ...(drawerOpen && level !== 1 && { ml: `${level * 18}px` }),
            ...(!drawerOpen && { pl: 1.25 }),
            ...(drawerOpen &&
              level === 1 &&
              mode !== ThemeMode.DARK && {
                '&:hover': {
                  bgcolor: 'primary.dark',
                  '& .MuiTypography-root': {
                    color: 'common.white'
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'common.white'  // Make icon white on hover
                  }
                },
                '&.Mui-selected': {
                  bgcolor: 'primary.dark',
                  color: iconSelectedColor,
                  '& .MuiListItemIcon-root': {
                    color: 'common.white' // Explicitly set icon color to white when selected
                  },
                  '&:hover': {
                    color: iconSelectedColor,
                    bgcolor: 'primary.dark',
                    '& .MuiListItemIcon-root': {
                      color: 'common.white' // Keep white on hover when selected
                    }
                  }
                }
              }),
            ...((!drawerOpen || level !== 1) && {
              py: level === 1 ? 0 : 1,
              '&:hover': {
                bgcolor: 'transparent',  // Add bgcolor for level 1 items when hovering
                '& .MuiListItemIcon-root': {
                  color: level === 1 ? 'common.white' : 'inherit'  // Change icon color to white on hover
                }
              },
              '&.Mui-selected': {
                bgcolor: 'transparent',  // Add bgcolor for level 1 items when selected
                '& .MuiListItemIcon-root': {
                  color: 'common.white'  // Ensure icon is white when selected
                },
                '&:hover': {
                  bgcolor: 'transparent',
                  '& .MuiListItemIcon-root': {
                    color: 'common.white'
                  }
                }
              }
            })
          }}
          selected={isSelected}
          onClick={() => itemHandler()}
        >
          <ButtonBase 
            aria-label="theme-icon" 
            sx={{ 
              borderRadius: `${borderRadius}px`,
              bgcolor: 'transparent', // Ensure ButtonBase has no background
              '&:hover': {
                bgcolor: 'transparent' // Keep ButtonBase transparent on hover
              }
            }} 
            disableRipple={drawerOpen}
          >
            <ListItemIcon
              sx={{
                minWidth: level === 1 ? 36 : 18,
                color: isSelected ? 'common.white' : 'text.primary', // Force white for selected
                ...(!drawerOpen &&
                  level === 1 && {
                    borderRadius: `${borderRadius}px`,
                    width: 46,
                    height: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      bgcolor: mode === ThemeMode.DARK ? alpha(theme.palette.primary.dark, 0.35) : 'primary.dark', // Changed to primary.dark
                      color: 'common.white'  // Add this to make icon white on hover
                    },
                    ...(isSelected && {
                      bgcolor: mode === ThemeMode.DARK ? alpha(theme.palette.primary.dark, 0.35) : 'primary.dark', // Consistent primary.dark
                      color: 'common.white',  // Ensure icon is white when selected
                      '&:hover': {
                        bgcolor: mode === ThemeMode.DARK ? alpha(theme.palette.primary.dark, 0.45) : 'primary.dark',
                        color: 'common.white'  // Keep icon white on hover when selected
                      }
                    })
                  })
              }}
            >
              {itemIcon}
            </ListItemIcon>
          </ButtonBase>

          {(drawerOpen || (!drawerOpen && level !== 1)) && (
            <Tooltip title={<FormattedMessage id={item.title} />} disableHoverListener={!hoverStatus}>
              <ListItemText
                primary={
                  <Typography
                    ref={ref}
                    noWrap
                    variant={isSelected ? 'h5' : 'body1'}
                    color={isSelected ? 'common.white' : 'inherit'}  // Change to white when selected
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: 102,
                      ...(themeDirection === ThemeDirection.RTL && { textAlign: 'end', direction: 'rtl' })
                    }}
                  >
                    <FormattedMessage id={item.title} />
                  </Typography>
                }
                secondary={
                  item.caption && (
                    <Typography variant="caption" gutterBottom sx={{ display: 'block', ...theme.typography.subMenuCaption }}>
                      <FormattedMessage id={item.caption} />
                    </Typography>
                  )
                }
              />
            </Tooltip>
          )}

          {drawerOpen && item.chip && (
            <Chip
              color={item.chip.color}
              variant={item.chip.variant}
              size={item.chip.size}
              label={item.chip.label}
              avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
            />
          )}
        </ListItemButton>
      ) : (
        <ListItemButton
          component={Link}
          href={item.url!}
          target={itemTarget}
          disabled={item.disabled}
          sx={{
            borderRadius: isParents ? `${borderRadius}px` : 0,
            mb: isParents ? 0 : 0.5,
            alignItems: 'flex-start',
            backgroundColor: level > 1 ? 'transparent !important' : 'inherit',
            py: 1,
            pl: 2,
            mr: isParents ? 1 : 0
          }}
          selected={isSelected}
          onClick={() => itemHandler()}
        >
          <ListItemIcon
            sx={{
              my: 'auto',
              minWidth: !item?.icon ? 18 : 36,
              color: isSelected ? 'common.white' : 'text.primary',  // Update for horizontal menu
              '&:hover': {
                color: 'common.white'  // Add hover color for horizontal menu
              }
            }}
          >
            {itemIcon}
          </ListItemIcon>

          <ListItemText
            sx={{ mb: 0.25 }}
            primary={
              <Typography variant={isSelected ? 'h5' : 'body1'} color="inherit">
                {item.title}
              </Typography>
            }
            secondary={
              item.caption && (
                <Typography variant="caption" gutterBottom sx={{ display: 'block', ...theme.typography.subMenuCaption }}>
                  {item.caption}
                </Typography>
              )
            }
          />

          {item.chip && (
            <Chip
              color={item.chip.color}
              variant={item.chip.variant}
              size={item.chip.size}
              label={item.chip.label}
              avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
            />
          )}
        </ListItemButton>
      )}
    </>
  );
}
