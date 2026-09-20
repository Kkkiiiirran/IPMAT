import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Complete } from './pages/Complete'
import { Drill } from './pages/Drill'
import { Home } from './pages/Home'
import { TablePicker } from './pages/TablePicker'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tables" element={<TablePicker />} />
          <Route path="/tables/:tableId" element={<Drill />} />
          <Route path="/tables/:tableId/done" element={<Complete />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
