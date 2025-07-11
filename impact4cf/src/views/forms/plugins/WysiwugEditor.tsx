'use client';

import { useState } from 'react';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import useConfig from 'hooks/useConfig';
import ReactQuill from 'ui-component/third-party/ReactQuill';
import ReactDraftWysiwyg from './Wysiwug/ReactDraftWysiwyg';
import { ThemeMode } from 'config';
import MainCard from 'ui-component/cards/MainCard';
import SecondaryAction from 'ui-component/cards/CardSecondaryAction';
import { gridSpacing } from 'store/constant';

// assets
import LinkIcon from '@mui/icons-material/Link';

// ==============================|| PLUGIN - EDITORS ||============================== //

export default function WysiwygEditor() {
  const { mode } = useConfig();
  const theme = useTheme();

  const [text, setText] = useState(
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
  );

  const handleChange = (value: string) => {
    setText(value);
  };

  return (
    <MainCard
      title="Wysiwyg Editor"
      secondary={
        <SecondaryAction icon={<LinkIcon sx={{ fontSize: 'small' }} />} link="https://www.npmjs.com/package/react-draft-wysiwyg" />
      }
    >
      <Grid container spacing={gridSpacing}>
        <Grid
          size={12}
          sx={{
            '& .rdw-editor-wrapper': {
              bgcolor: mode === ThemeMode.DARK ? 'dark.main' : 'background.paper',
              border: '1px solid',
              borderColor: mode === ThemeMode.DARK ? alpha(theme.palette.dark.light, 0.2) : 'primary.light',
              borderRadius: '12px',
              overflow: 'scroll',
              '& .rdw-editor-main': {
                px: 2,
                py: 0.5,
                border: 'none'
              },
              '& .rdw-editor-toolbar': {
                pt: 1.25,
                border: 'none',
                borderBottom: '1px solid',
                borderColor: mode === ThemeMode.DARK ? alpha(theme.palette.dark.light, 0.2) : 'primary.light',
                bgcolor: mode === ThemeMode.DARK ? 'dark.light' : 'grey.50',
                '& .rdw-option-wrapper': {
                  bgcolor: mode === ThemeMode.DARK ? 'dark.light' : 'grey.50',
                  borderColor: mode === ThemeMode.DARK ? 'dark.dark' : 'grey.900'
                },
                '& .rdw-dropdown-wrapper': {
                  bgcolor: mode === ThemeMode.DARK ? 'dark.light' : 'grey.50',
                  borderColor: mode === ThemeMode.DARK ? 'dark.dark' : 'grey.900',
                  '& .rdw-dropdown-selectedtext': {
                    color: mode === ThemeMode.DARK ? 'dark.dark' : 'grey.900'
                  }
                },
                '.rdw-dropdownoption-active': {
                  ...(mode === ThemeMode.DARK && { bgcolor: 'dark.main' })
                },
                '& .rdw-embedded-modal-link-input, & .rdw-embedded-modal-size-input, & .rdw-link-modal-input, & .rdw-image-modal-url-input, & .rdw-image-modal-size-input':
                  {
                    ...(mode === ThemeMode.DARK && {
                      bgcolor: 'dark.main',
                      borderColor: alpha(theme.palette.grey[200], 0.2)
                    })
                  },
                '.rdw-dropdownoption-highlighted': {
                  color: 'grey.800',
                  ...(mode === ThemeMode.DARK && { bgcolor: 'dark.light' })
                },
                '& .rdw-embedded-modal-btn:disabled ': {
                  color: mode === ThemeMode.DARK ? 'grey.900' : 'inherit'
                },
                '& .rdw-fontfamily-optionwrapper': {
                  bgcolor: mode === ThemeMode.DARK ? 'dark.dark' : 'common.white'
                },
                '& .rdw-dropdown-optionwrapper': {
                  bgcolor: mode === ThemeMode.DARK ? 'dark.dark' : 'common.white',
                  ...(mode === ThemeMode.DARK && {
                    borderColor: alpha(theme.palette.grey[200], 0.2)
                  })
                },
                '& .rdw-colorpicker-modal': {
                  bgcolor: mode === ThemeMode.DARK ? 'dark.dark' : 'common.white'
                },
                '& .rdw-colorpicker-modal, & .rdw-embedded-modal, & .rdw-link-modal, & .rdw-emoji-modal, & .rdw-image-modal': {
                  ...(mode === ThemeMode.DARK && {
                    borderColor: alpha(theme.palette.grey[200], 0.2),
                    boxShadow: `3px 3px 5px ${alpha(theme.palette.grey[200], 0.2)}`
                  })
                },
                '& .rdw-inline-wrapper': { rowGap: 0.75 },
                '& .rdw-link-modal': { bgcolor: mode === ThemeMode.DARK ? 'dark.dark' : 'common.white' },
                '& .rdw-image-modal': { bgcolor: mode === ThemeMode.DARK ? 'dark.dark' : 'common.white' },
                '& .rdw-embedded-modal': { bgcolor: mode === ThemeMode.DARK ? 'dark.dark' : 'common.white' },
                '& .rdw-emoji-modal': { bgcolor: mode === ThemeMode.DARK ? 'dark.dark' : 'common.white' },
                '& .rdw-embedded-modal-btn': { color: mode === ThemeMode.DARK ? 'grey.800' : 'inherit' },
                '& .rdw-link-modal-btn': { color: mode === ThemeMode.DARK ? 'grey.800' : 'inherit' },
                '& .rdw-link-modal-btn:disabled': { color: mode === ThemeMode.DARK ? 'grey.900' : 'inherit' },
                '& .rdw-image-modal-btn': { color: mode === ThemeMode.DARK ? 'grey.800' : 'inherit' },
                '& .rdw-image-modal-btn:disabled': { color: mode === ThemeMode.DARK ? 'grey.900' : 'inherit' }
              }
            }
          }}
        >
          <Stack spacing={gridSpacing}>
            <Typography variant="subtitle1">React Draft</Typography>
            <ReactDraftWysiwyg />
          </Stack>
        </Grid>
        <Grid size={12}>
          <Stack spacing={gridSpacing}>
            <Typography variant="subtitle1">React Quill</Typography>
            <ReactQuill value={text} onChange={handleChange} />
          </Stack>
        </Grid>
      </Grid>
    </MainCard>
  );
}
