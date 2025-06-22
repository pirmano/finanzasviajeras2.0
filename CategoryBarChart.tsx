import React, { useEffect, useRef } from 'react';

declare var Chart: any; // Using 'any' for Chart.js global, can be refined with specific types if needed

interface CategoryBarChartProps {
  labels: string[];
  data: number[];
  backgroundColors: string[];
  title?: string;
}

const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ labels, data, backgroundColors, title = "Gastos por Categoría" }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<any | null>(null); // To store the chart instance

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy previous chart instance if it exists
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Total Gastado',
              data: data,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color.replace('0.8', '1')), // Slightly darker border
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: !!title,
                text: title,
                font: {
                  size: 16,
                },
                color: '#e2e8f0' // slate-200
              },
              legend: {
                display: false, // Labels on bars are usually enough
              },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.7)',
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#94a3b8', // slate-400
                  callback: function(value: any) {
                    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                  }
                },
                grid: {
                  color: '#334155' // slate-700
                }
              },
              x: {
                ticks: {
                  color: '#94a3b8' // slate-400
                },
                grid: {
                  display: false // No vertical grid lines usually for bar charts
                }
              }
            }
          }
        });
      }
    }

    // Cleanup function to destroy chart instance on component unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [labels, data, backgroundColors, title]); // Re-run effect if data changes

  return (
    <div style={{ height: '300px', width: '100%' }}> {/* Ensure canvas has dimensions */}
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default CategoryBarChart;