import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Analytics } from './pages/Analytics'
import { ArithmeticComplete } from './pages/ArithmeticComplete'
import { ArithmeticDrill } from './pages/ArithmeticDrill'
import { Complete } from './pages/Complete'
import { Drill } from './pages/Drill'
import { Home } from './pages/Home'
import { OpLevelPicker } from './pages/OpLevelPicker'
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

          <Route path="/addition" element={<OpLevelPicker op="add" />} />
          <Route path="/addition/:levelId" element={<ArithmeticDrill op="add" />} />
          <Route
            path="/addition/:levelId/done"
            element={<ArithmeticComplete op="add" />}
          />

          <Route path="/subtraction" element={<OpLevelPicker op="sub" />} />
          <Route
            path="/subtraction/:levelId"
            element={<ArithmeticDrill op="sub" />}
          />
          <Route
            path="/subtraction/:levelId/done"
            element={<ArithmeticComplete op="sub" />}
          />

          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics/:moduleId" element={<Analytics />} />
          <Route
            path="/analytics/:moduleId/:subModuleId"
            element={<Analytics />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
