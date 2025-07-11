'use client';

import { useState, SyntheticEvent } from 'react';

// material-ui
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';

// project imports
import SubCard from 'ui-component/cards/SubCard';
import Avatar from 'ui-component/extended/Avatar';
import MainCard from 'ui-component/cards/MainCard';

// third party
import Lightbox from 'react-18-image-lightbox';

// assets
import FiberManualRecordTwoToneIcon from '@mui/icons-material/FiberManualRecordTwoTone';

const Avatar1 = '/assets/images/users/avatar-1.png';
const Avatar2 = '/assets/images/users/avatar-3.png';
const Article1 = '/assets/images/blog/blog-1.png';
const Article2 = '/assets/images/blog/library-1.png';
const Article3 = '/assets/images/blog/library-2.png';
const Article4 = '/assets/images/blog/library-3.png';
const Article5 = '/assets/images/blog/blog-5.png';
const Article6 = '/assets/images/blog/blog-2.png';
const Article7 = '/assets/images/blog/blog-3.png';
const Article8 = '/assets/images/blog/blog-4.png';

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

const card1Images = [
  { src: Article1, title: 'Image 1' },
  { src: Article2, title: 'Image 2' },
  { src: Article3, title: 'Image 3' },
  { src: Article4, title: 'Image 4' }
];

const card2Images = [
  { src: Article5, title: 'Image 5' },
  { src: Article6, title: 'Image 6' },
  { src: Article7, title: 'Image 7' },
  { src: Article8, title: 'Image 8' }
];

// ==============================|| BLOG - YOUR LIBRARY ||============================== //

export default function YourLibrary() {
  const [tabValue, setTabValue] = useState(0);
  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [photoIndex, setPhotoIndex] = useState<number>(0);
  const [activeImages, setActiveImages] = useState<{ src: string; title: string }[]>([]);

  const handleCardClick = (index: number, images: { src: string; title: string }[]) => {
    setActiveImages(images);
    setPhotoIndex(index);
    setIsOpen(true);
  };

  const articles = [
    {
      avatar: Avatar1,
      title: 'Year Wrap-up 2022 - December Edition',
      name: 'John Doe',
      duration: '3 min read',
      images: card1Images,
      description:
        'A content management system is computer software used to manage the creation and modification of digital content. A CMS is typically used for enterprise content management.'
    },
    {
      avatar: Avatar2,
      title: 'Tech Trends 2024 - January Edition',
      name: 'Brendan Smith',
      duration: '5 min read',
      images: card2Images,
      description:
        'The Tech Trends 2024 - January Edition highlights the growing integration of generative AI in businesses, advances in spatial computing, and increasing focus on sustainability.'
    }
  ];

  return (
    <MainCard
      content={false}
      title="Your Library"
      secondary={
        <Box sx={{ 'MuiTabs-root a': { p: { xs: '3px 4px', sm: 'initial' } } }}>
          <Tabs
            value={tabValue}
            variant="scrollable"
            onChange={handleChange}
            sx={{
              p: 0,
              '& .MuiTab-root': {
                borderRadius: 1,
                color: 'grey.600',
                textTransform: 'none',
                '&.Mui-selected': {
                  color: 'primary.main',
                  bgcolor: 'primary.light'
                }
              },
              '& .MuiTabs-flexContainer': {
                border: 0,
                gap: 0.25
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab label="Your lists" {...a11yProps(0)} />
            <Tab label="Save lists" {...a11yProps(1)} />
            <Tab label="Highlights" {...a11yProps(2)} />
            <Tab label="Reading history" {...a11yProps(2)} />
          </Tabs>
        </Box>
      }
      sx={{
        '& .MuiCardHeader-action': { maxWidth: { xs: '95%', sm: '70%' } },
        '& .MuiCardHeader-root': { flexWrap: 'wrap', gap: 1.5 }
      }}
    >
      <CardContent>
        <Stack sx={{ gap: 2 }}>
          {articles.map((article, index) => (
            <SubCard key={index} contentSX={{ '&:last-child': { pb: 2.5 } }}>
              <Stack sx={{ gap: 1.25 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                    <Avatar size="badge" alt="User 1" src={article.avatar} />
                    <Typography variant="h6">{article.name}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
                    <FiberManualRecordTwoToneIcon sx={{ color: 'text.disabled', fontSize: 8 }} />
                    <Typography variant="caption">{article.duration}</Typography>
                  </Stack>
                </Stack>
                <Stack sx={{ gap: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 500 }}>
                    {article.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'grey.500' }}>
                    {article.description}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ gap: 0.5, overflow: 'auto' }}>
                  {article.images.map((image, index) => (
                    <Card key={index} onClick={() => handleCardClick(index, article.images)} sx={{ cursor: 'pointer' }}>
                      <CardMedia component="img" height="140" image={image.src} alt={image.title} />
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </SubCard>
          ))}
        </Stack>
      </CardContent>
      {isOpen && (
        <Lightbox
          mainSrc={activeImages[photoIndex].src}
          nextSrc={activeImages[(photoIndex + 1) % activeImages.length].src}
          prevSrc={activeImages[(photoIndex + activeImages.length - 1) % activeImages.length].src}
          onCloseRequest={() => setIsOpen(false)}
          onMovePrevRequest={() => setPhotoIndex((photoIndex + activeImages.length - 1) % activeImages.length)}
          onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % activeImages.length)}
        />
      )}
    </MainCard>
  );
}
