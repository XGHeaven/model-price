import './App.css'
import { ModelPriceTable } from './components/ModelPriceTable'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            大模型价格对比
          </h1>
          <p className="text-lg text-gray-600">
            对比不同大模型的定价信息
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <ModelPriceTable />
        </div>

      </div>
    </div>
  )
}

export default App
