import type { NextConfig } from 'next';

const nextConfig: NextConfig = {


  output: 'standalone', 

  reactStrictMode: false,

  // Modularize MUI imports
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}'
    },
    '@mui/lab': {
      transform: '@mui/lab/{{member}}'
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}'
    }
  },

  // Remote images pattern
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '**'
      }
    ]
  },


  typescript: {

    ignoreBuildErrors: true
  },
  eslint: {

    ignoreDuringBuilds: true
  }
};


export default nextConfig;
