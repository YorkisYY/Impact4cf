'use client';

import { useRouter } from 'next/navigation';

import { useEffect, useRef, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { FormattedMessage } from 'react-intl';
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import useAuth from 'hooks/useAuth';
import { IconLogout, IconSettings} from '@tabler/icons-react';
import useConfig from 'hooks/useConfig';
import { IconUser } from '@tabler/icons-react';
import { authFetcherWithRedirect } from '@/utils/withAuthRedirect';
// ==============================|| PROFILE MENU ||============================== //

export default function ProfileSection() {
  const theme = useTheme();
  const { borderRadius } = useConfig();
  const router = useRouter();


  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);


  const anchorRef = useRef<any>(null);
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  const handleListItemClick = (event: React.MouseEvent<HTMLDivElement>, index: number, route: string = '') => {
    setSelectedIndex(index);
    handleClose(event);

    if (route && route !== '') {
      router.push(route);
    }
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: React.MouseEvent<HTMLDivElement> | MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  
  
  // get username from token
  const decodeUserIDFromToken = (token: string): string | null => {
    try {
      const decoded = jwtDecode(token) as { [key: string]: any } | null;
      if (!decoded) return null;

      // Check common fields
      return decoded.user_id;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  // Get the serviceToken from cookies
  function getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }

  // Extract the token and use it
  const serviceToken = getCookie('serviceToken');
  let userID: string | null = null;
  if (serviceToken) {
    userID = decodeUserIDFromToken(serviceToken);
  } else {
    console.error('serviceToken not found in cookies');
  }
  // Get the username from API
  const [username, setUsername] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUsername = async () => {
      if (!userID) return;
      
      try {
        const userResponse = await authFetcherWithRedirect(`api/users/${userID}`);
        setUsername(userResponse.name || "User");
      } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        console.error('Error fetching data:', error);
      }
    };
    
    fetchUsername();
  }, [userID]);

  const getInitials = (name: string): string => {
    if (!name) return 'NA';
    
    // Split the name by spaces
    const nameParts = name.split(' ');
    
    // If only one part, return the first two characters capitalized
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    // Return first letter of first name and first letter of last name
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const username_initials = getInitials(username || '');

  return (
    <>
      <Chip
        sx={{
          ml: 2,
          height: '48px',
          alignItems: 'center',
          borderRadius: '27px',
          '& .MuiChip-label': {
            lineHeight: 0
          }
        }}
        icon={
          <Avatar color="primary" sx={{ fontSize: '1rem' }}>
            {username_initials}
          </Avatar>
        }
        label={<IconSettings stroke={1.5} size="24px" />}
        ref={anchorRef}
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        color="primary"
        aria-label="user-account"
      />
      <Popper
        placement="bottom"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 14]
            }
          }
        ]}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions in={open} {...TransitionProps}>
              <Paper>
                {open && (
                  <MainCard border={false} elevation={16} content={false} boxShadow shadow={theme.shadows[16]}>
                    <Box sx={{ p: 2, py: 0 }}>
                      <List
                        component="nav"
                        sx={{
                          width: '100%',
                          maxWidth: 350,
                          minWidth: 200,
                          borderRadius: `${borderRadius}px`,
                          '& .MuiListItemButton-root': { mt: 0.5 }
                        }}
                      >
                        <ListItemButton
                          sx={{ 
                            borderRadius: `${borderRadius}px`,
                            '&:hover': {
                              bgcolor: 'primary.dark',
                              '& .MuiListItemIcon-root, & .MuiTypography-root': {
                                color: 'common.white'
                              }
                            },
                            '&.Mui-selected': {
                              bgcolor: 'primary.dark',
                              '& .MuiListItemIcon-root, & .MuiTypography-root': {
                                color: 'common.white'
                              },
                              '&:hover': {
                                bgcolor: 'primary.dark',
                                '& .MuiListItemIcon-root, & .MuiTypography-root': {
                                  color: 'common.white'
                                }
                              }
                            }
                          }}
                          selected={selectedIndex === 0}
                          onClick={(event: React.MouseEvent<HTMLDivElement>) =>
                            handleListItemClick(event, 0, '/user-profile')
                          }
                        >
                          <ListItemIcon>
                            <IconUser stroke={1.5} size="20px" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                 My Account
                              </Typography>
                            }
                          />
                        </ListItemButton>
                        <ListItemButton 
                          sx={{ 
                            borderRadius: `${borderRadius}px`,
                            '&:hover': {
                              bgcolor: 'primary.dark',
                              '& .MuiListItemIcon-root, & .MuiTypography-root': {
                                color: 'common.white'
                              }
                            },
                            '&.Mui-selected': {
                              bgcolor: 'primary.dark',
                              '& .MuiListItemIcon-root, & .MuiTypography-root': {
                                color: 'common.white'
                              },
                              '&:hover': {
                                bgcolor: 'primary.dark',
                                '& .MuiListItemIcon-root, & .MuiTypography-root': {
                                  color: 'common.white'
                                }
                              }
                            }
                          }} 
                          selected={selectedIndex === 4} 
                          onClick={handleLogout}
                        >
                          <ListItemIcon>
                            <IconLogout stroke={1.5} size="20px" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                <FormattedMessage id="logout" />
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </List>
                    </Box>
                  </MainCard>
                )}
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
}
