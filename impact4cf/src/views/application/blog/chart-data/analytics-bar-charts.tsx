import { Props } from 'react-apexcharts';

const chartData: Props = {
  height: 286,
  type: 'bar',
  options: {
    chart: {
      id: 'bar-chart',
      stacked: true,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: true
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '50%'
            }
          },
          xaxis: {
            tickAmount: 15,
            labels: {
              rotate: 0,
              style: {
                fontSize: 9
              }
            }
          },
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '75%'
      }
    },
    xaxis: {
      type: 'category',
      categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
    },
    legend: {
      show: true,
      fontFamily: `'Roboto', sans-serif`,
      position: 'bottom',
      offsetX: 20,
      labels: {
        useSeriesColors: false
      },
      markers: {
        width: 12,
        height: 12,
        radius: 20,
        offsetX: -5
      },
      itemMargin: {
        horizontal: 10,
        vertical: 16
      }
    },
    fill: {
      type: 'solid',
      opacity: 1
    },
    states: {
      hover: {
        filter: {
          type: 'none'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      show: false
    }
  },
  series: [
    {
      name: 'Blog views',
      data: [0, 0, 0, 0, 6, 7, 10, 18, 10, 12, 0, 14, 11, 7, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 12, 6, 4, 2]
    },
    {
      name: 'None',
      data: [4, 16, 7, 7, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 22, 6, 11, 7, 3, 4, 6, 8, 10, 8, 0, 0, 0, 0, 0]
    }
  ]
};

export default chartData;
