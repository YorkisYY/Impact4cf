
'use client'
import dynamic from 'next/dynamic';
// import OrgChart from 'views/forms/chart/OrgChart';
// ==============================|| PAGE ||============================== //

const OrgChart = dynamic(() => import('views/forms/chart/OrgChart'), {
  ssr: false
});



export default function OrgChartPage() {
  return <OrgChart />;
}
