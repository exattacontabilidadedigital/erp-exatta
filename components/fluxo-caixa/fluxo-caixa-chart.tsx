"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveLine } from '@nivo/line'

const rawData = [
  { data: "01/01", saldoInicial: 120000, entradas: 15000, saidas: 12000, saldoFinal: 123000 },
  { data: "02/01", saldoInicial: 123000, entradas: 18000, saidas: 14000, saldoFinal: 127000 },
  { data: "03/01", saldoInicial: 127000, entradas: 12000, saidas: 16000, saldoFinal: 123000 },
  { data: "04/01", saldoInicial: 123000, entradas: 22000, saidas: 18000, saldoFinal: 127000 },
  { data: "05/01", saldoInicial: 127000, entradas: 16000, saidas: 13000, saldoFinal: 130000 },
  { data: "06/01", saldoInicial: 130000, entradas: 19000, saidas: 15000, saldoFinal: 134000 },
  { data: "07/01", saldoInicial: 134000, entradas: 14000, saidas: 17000, saldoFinal: 131000 },
  { data: "08/01", saldoInicial: 131000, entradas: 21000, saidas: 16000, saldoFinal: 136000 },
  { data: "09/01", saldoInicial: 136000, entradas: 17000, saidas: 14000, saldoFinal: 139000 },
  { data: "10/01", saldoInicial: 139000, entradas: 13000, saidas: 19000, saldoFinal: 133000 },
]

const data = [
  {
    id: 'Entradas',
    color: '#10b981',
    data: rawData.map(d => ({ x: d.data, y: d.entradas }))
  },
  {
    id: 'Saídas',
    color: '#ef4444',
    data: rawData.map(d => ({ x: d.data, y: d.saidas }))
  },
  {
    id: 'Saldo Final',
    color: '#3b82f6',
    data: rawData.map(d => ({ x: d.data, y: d.saldoFinal }))
  }
]

export function FluxoCaixaChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do Fluxo de Caixa - Últimos 10 Dias</CardTitle>
      </CardHeader>
      <CardContent style={{ height: 300 }}>
        <ResponsiveLine
          data={data}
          margin={{ top: 30, right: 30, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Data',
            legendPosition: 'middle',
            legendOffset: 36
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Valor (R$)',
            legendPosition: 'middle',
            legendOffset: -50
          }}
          colors={d => d.color}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          enableSlices="x"
          useMesh={true}
          legends={[{
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 0,
            translateY: 0,
            itemsSpacing: 4,
            itemDirection: 'left-to-right',
            itemWidth: 100,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1
                }
              }
            ]
          }]}
          tooltip={({ point }) => (
            <div style={{ background: '#fff', padding: '6px 12px', border: '1px solid #eee', borderRadius: 4 }}>
              <strong>{point.seriesId}</strong>: R$ {point.data.yFormatted.toLocaleString()}
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
