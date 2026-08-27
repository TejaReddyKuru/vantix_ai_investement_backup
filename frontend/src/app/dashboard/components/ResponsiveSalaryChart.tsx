"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const data = [
  { time: 'Jan', value: 10000 },
  { time: 'Feb', value: 10500 },
  { time: 'Mar', value: 9800 },
  { time: 'Apr', value: 12000 },
  { time: 'May', value: 11800 },
  { time: 'Jun', value: 12345 },
]

export default function ResponsiveSalaryChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="time" stroke="var(--muted)" />
        <YAxis stroke="var(--muted)" />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
